-- ============================================================================
-- Comunidade — Onda 2: continuidade social + memória coletiva
-- ============================================================================

-- 1) community_subscriptions
CREATE TABLE public.community_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.community_cases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  last_seen_reply_count integer NOT NULL DEFAULT 0,
  last_seen_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_subscriptions_unique UNIQUE (case_id, user_id)
);

ALTER TABLE public.community_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions"
ON public.community_subscriptions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all subscriptions"
ON public.community_subscriptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_community_subscriptions_user
  ON public.community_subscriptions(user_id);
CREATE INDEX idx_community_subscriptions_case
  ON public.community_subscriptions(case_id);

-- 2) Outcome columns on community_cases
ALTER TABLE public.community_cases
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS outcome_kind text,
  ADD COLUMN IF NOT EXISTS outcome_at timestamptz;

-- Validation trigger for outcome_kind (avoid CHECK constraint per memory rule)
CREATE OR REPLACE FUNCTION public.validate_community_outcome_kind()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.outcome_kind IS NOT NULL
     AND NEW.outcome_kind NOT IN (
       'aplicou_funcionou',
       'aplicou_nao_funcionou',
       'nao_aplicou',
       'em_andamento'
     ) THEN
    RAISE EXCEPTION 'outcome_kind inválido: %', NEW.outcome_kind;
  END IF;
  -- Auto-stamp outcome_at when outcome is set/changed
  IF NEW.outcome IS NOT NULL
     AND (OLD.outcome IS NULL OR OLD.outcome IS DISTINCT FROM NEW.outcome) THEN
    NEW.outcome_at := COALESCE(NEW.outcome_at, now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_community_outcome
BEFORE INSERT OR UPDATE ON public.community_cases
FOR EACH ROW EXECUTE FUNCTION public.validate_community_outcome_kind();

-- 3) Auto-subscribe author on case creation
CREATE OR REPLACE FUNCTION public.community_autosubscribe_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.community_subscriptions
    (case_id, user_id, last_seen_reply_count, last_seen_status)
  VALUES
    (NEW.id, NEW.user_id, 0, NEW.status::text)
  ON CONFLICT (case_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_community_autosubscribe_author
AFTER INSERT ON public.community_cases
FOR EACH ROW EXECUTE FUNCTION public.community_autosubscribe_author();

-- 4) Auto-subscribe replier
CREATE OR REPLACE FUNCTION public.community_autosubscribe_replier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.community_subscriptions
    (case_id, user_id, last_seen_reply_count, last_seen_status)
  SELECT NEW.case_id, NEW.user_id, c.reply_count, c.status::text
    FROM public.community_cases c
   WHERE c.id = NEW.case_id
  ON CONFLICT (case_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_community_autosubscribe_replier
AFTER INSERT ON public.community_replies
FOR EACH ROW EXECUTE FUNCTION public.community_autosubscribe_replier();

-- 5) Helper RPC: list of unread updates for current user
-- Returns cases the user follows whose reply_count or status changed since last_seen
CREATE OR REPLACE FUNCTION public.community_my_updates()
RETURNS TABLE(
  case_id uuid,
  title text,
  status public.community_case_status,
  reply_count integer,
  last_seen_reply_count integer,
  has_outcome boolean,
  updated_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id AS case_id,
         c.title,
         c.status,
         c.reply_count,
         s.last_seen_reply_count,
         (c.outcome IS NOT NULL) AS has_outcome,
         c.updated_at
    FROM public.community_subscriptions s
    JOIN public.community_cases c ON c.id = s.case_id
   WHERE s.user_id = auth.uid()
     AND (
       c.reply_count > s.last_seen_reply_count
       OR (s.last_seen_status IS DISTINCT FROM c.status::text)
       OR (c.outcome IS NOT NULL AND c.outcome_at > s.created_at)
     )
   ORDER BY c.updated_at DESC
   LIMIT 50;
$$;

-- 6) RPC to mark case as seen (updates last_seen pointer)
CREATE OR REPLACE FUNCTION public.community_mark_seen(_case_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.community_subscriptions
     SET last_seen_reply_count = c.reply_count,
         last_seen_status = c.status::text
    FROM public.community_cases c
   WHERE community_subscriptions.case_id = _case_id
     AND community_subscriptions.user_id = auth.uid()
     AND c.id = _case_id;
END;
$$;

-- 7) Lightweight community pulse (vida): last 24h aggregate
CREATE OR REPLACE FUNCTION public.community_pulse_24h()
RETURNS TABLE(
  resolved_today bigint,
  waiting_help bigint,
  helpers_today bigint,
  new_cases_today bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.community_cases
       WHERE status = 'resolvido' AND updated_at >= now() - interval '24 hours')::bigint,
    (SELECT COUNT(*) FROM public.community_cases
       WHERE status = 'aberto' AND reply_count = 0)::bigint,
    (SELECT COUNT(DISTINCT user_id) FROM public.community_replies
       WHERE created_at >= now() - interval '24 hours' AND is_ai = false)::bigint,
    (SELECT COUNT(*) FROM public.community_cases
       WHERE created_at >= now() - interval '24 hours')::bigint;
$$;

-- 8) Implicit expertise: top tags from helpful replies (last 90d)
CREATE OR REPLACE FUNCTION public.community_user_expertise(_user_id uuid)
RETURNS TABLE(area text, helpful_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(c.consortium_type, c.stage, 'geral') AS area,
         SUM(GREATEST(r.helpful_count, 0))::bigint AS helpful_count
    FROM public.community_replies r
    JOIN public.community_cases c ON c.id = r.case_id
   WHERE r.user_id = _user_id
     AND r.created_at >= now() - interval '90 days'
     AND r.helpful_count > 0
   GROUP BY 1
   ORDER BY 2 DESC
   LIMIT 5;
$$;