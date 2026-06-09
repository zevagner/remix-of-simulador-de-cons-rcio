-- ════════════════════════════════════════════════════════════════════════
-- COMMUNITY MODULE — Onda 1: cases, replies, votes, engagement
-- ════════════════════════════════════════════════════════════════════════

-- ═══════ ENUMS ═══════
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'community_case_status') THEN
    CREATE TYPE public.community_case_status AS ENUM ('aberto', 'resolvido', 'arquivado');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'community_source_kind') THEN
    CREATE TYPE public.community_source_kind AS ENUM ('proposal', 'post_sale', 'manual');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'community_vote_kind') THEN
    CREATE TYPE public.community_vote_kind AS ENUM ('util', 'nao_util');
  END IF;
END$$;

-- ═══════ user_engagement (materializada) ═══════
CREATE TABLE IF NOT EXISTS public.user_engagement (
  user_id uuid PRIMARY KEY,
  score integer NOT NULL DEFAULT 0,
  level smallint NOT NULL DEFAULT 1,
  simulations_count integer NOT NULL DEFAULT 0,
  proposals_count integer NOT NULL DEFAULT 0,
  ai_usage_count integer NOT NULL DEFAULT 0,
  active_days_count integer NOT NULL DEFAULT 0,
  helpful_replies_count integer NOT NULL DEFAULT 0,
  cases_created_count integer NOT NULL DEFAULT 0,
  replies_created_count integer NOT NULL DEFAULT 0,
  last_computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_engagement_level ON public.user_engagement(level);
CREATE INDEX IF NOT EXISTS idx_user_engagement_score ON public.user_engagement(score DESC);

ALTER TABLE public.user_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own engagement"
  ON public.user_engagement FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all engagement"
  ON public.user_engagement FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Inserts/updates somente via security definer functions (chamadas pelo backend lógico).
CREATE POLICY "Service role manages engagement"
  ON public.user_engagement FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════ Helper: nível atual do usuário (sem recursão) ═══════
CREATE OR REPLACE FUNCTION public.community_user_level(_user_id uuid)
RETURNS smallint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT level FROM public.user_engagement WHERE user_id = _user_id),
    1::smallint
  );
$$;

-- ═══════ community_cases ═══════
CREATE TABLE IF NOT EXISTS public.community_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 4 AND 160),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 10 AND 4000),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  consortium_type text,
  stage text,
  status public.community_case_status NOT NULL DEFAULT 'aberto',
  is_private boolean NOT NULL DEFAULT false,
  source_kind public.community_source_kind NOT NULL DEFAULT 'manual',
  source_id uuid,
  helpful_count integer NOT NULL DEFAULT 0,
  reply_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_cases_user ON public.community_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_community_cases_status ON public.community_cases(status);
CREATE INDEX IF NOT EXISTS idx_community_cases_created ON public.community_cases(created_at DESC);

ALTER TABLE public.community_cases ENABLE ROW LEVEL SECURITY;

-- SELECT: dono sempre vê; aprovados veem públicos; nível ≥ 3 vê privados.
CREATE POLICY "Users view community cases"
  ON public.community_cases FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (
      public.is_approved(auth.uid())
      AND (
        is_private = false
        OR public.community_user_level(auth.uid()) >= 3
      )
    )
  );

-- INSERT: nível ≥ 2 (e aprovado).
CREATE POLICY "Users create community cases"
  ON public.community_cases FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_approved(auth.uid())
    AND public.community_user_level(auth.uid()) >= 2
  );

CREATE POLICY "Authors update own cases"
  ON public.community_cases FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors delete own cases"
  ON public.community_cases FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all cases"
  ON public.community_cases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ═══════ community_replies ═══════
CREATE TABLE IF NOT EXISTS public.community_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.community_cases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 4 AND 4000),
  is_ai boolean NOT NULL DEFAULT false,
  is_accepted boolean NOT NULL DEFAULT false,
  helpful_count integer NOT NULL DEFAULT 0,
  not_helpful_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_replies_case ON public.community_replies(case_id);
CREATE INDEX IF NOT EXISTS idx_community_replies_user ON public.community_replies(user_id);

ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

-- SELECT: quem pode ver o caso pode ver as respostas.
CREATE POLICY "Users view replies of visible cases"
  ON public.community_replies FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_cases c
      WHERE c.id = community_replies.case_id
        AND (
          c.user_id = auth.uid()
          OR (
            public.is_approved(auth.uid())
            AND (
              c.is_private = false
              OR public.community_user_level(auth.uid()) >= 3
            )
          )
        )
    )
  );

-- INSERT: autor do caso (qualquer nível) OU usuário nível ≥ 3 aprovado.
CREATE POLICY "Users create replies"
  ON public.community_replies FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_approved(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.community_cases c
      WHERE c.id = community_replies.case_id
        AND (
          c.user_id = auth.uid()
          OR public.community_user_level(auth.uid()) >= 3
        )
    )
  );

CREATE POLICY "Authors update own replies"
  ON public.community_replies FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors delete own replies"
  ON public.community_replies FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Autor do caso pode atualizar is_accepted/status via update no caso (gatilho separado, fora do escopo desta onda — UI marcará via update direto na resposta usando rpc no futuro).
CREATE POLICY "Case authors mark replies accepted"
  ON public.community_replies FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.community_cases c WHERE c.id = community_replies.case_id AND c.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.community_cases c WHERE c.id = community_replies.case_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Admins manage all replies"
  ON public.community_replies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ═══════ community_reply_votes ═══════
CREATE TABLE IF NOT EXISTS public.community_reply_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reply_id uuid NOT NULL REFERENCES public.community_replies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote public.community_vote_kind NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reply_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_votes_reply ON public.community_reply_votes(reply_id);

ALTER TABLE public.community_reply_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view votes on visible replies"
  ON public.community_reply_votes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.community_replies r
      JOIN public.community_cases c ON c.id = r.case_id
      WHERE r.id = community_reply_votes.reply_id
        AND (
          c.user_id = auth.uid()
          OR (
            public.is_approved(auth.uid())
            AND (c.is_private = false OR public.community_user_level(auth.uid()) >= 3)
          )
        )
    )
  );

-- INSERT: nível ≥ 2, não pode votar na própria resposta, caso visível.
CREATE POLICY "Users vote on replies"
  ON public.community_reply_votes FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_approved(auth.uid())
    AND public.community_user_level(auth.uid()) >= 2
    AND NOT EXISTS (
      SELECT 1 FROM public.community_replies r
      WHERE r.id = community_reply_votes.reply_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users update own vote"
  ON public.community_reply_votes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own vote"
  ON public.community_reply_votes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ═══════ Triggers de contadores agregados ═══════

-- updated_at automático
CREATE TRIGGER trg_community_cases_updated
  BEFORE UPDATE ON public.community_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_community_replies_updated
  BEFORE UPDATE ON public.community_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_user_engagement_updated
  BEFORE UPDATE ON public.user_engagement
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- reply_count em community_cases
CREATE OR REPLACE FUNCTION public.community_sync_case_reply_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_cases
       SET reply_count = reply_count + 1
     WHERE id = NEW.case_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_cases
       SET reply_count = GREATEST(reply_count - 1, 0)
     WHERE id = OLD.case_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_community_replies_count
  AFTER INSERT OR DELETE ON public.community_replies
  FOR EACH ROW EXECUTE FUNCTION public.community_sync_case_reply_count();

-- helpful_count em community_replies + replies_helpful no engagement do dono
CREATE OR REPLACE FUNCTION public.community_sync_vote_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reply_owner uuid;
  v_delta_helpful integer := 0;
  v_delta_not integer := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote = 'util' THEN v_delta_helpful := 1; ELSE v_delta_not := 1; END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote = 'util' THEN v_delta_helpful := -1; ELSE v_delta_not := -1; END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote IS DISTINCT FROM NEW.vote THEN
      IF NEW.vote = 'util' THEN v_delta_helpful := 1; v_delta_not := -1;
      ELSE v_delta_helpful := -1; v_delta_not := 1; END IF;
    END IF;
  END IF;

  UPDATE public.community_replies
     SET helpful_count = GREATEST(helpful_count + v_delta_helpful, 0),
         not_helpful_count = GREATEST(not_helpful_count + v_delta_not, 0)
   WHERE id = COALESCE(NEW.reply_id, OLD.reply_id)
   RETURNING user_id INTO v_reply_owner;

  IF v_reply_owner IS NOT NULL AND v_delta_helpful <> 0 THEN
    INSERT INTO public.user_engagement (user_id, helpful_replies_count)
    VALUES (v_reply_owner, GREATEST(v_delta_helpful, 0))
    ON CONFLICT (user_id) DO UPDATE
      SET helpful_replies_count = GREATEST(user_engagement.helpful_replies_count + v_delta_helpful, 0),
          updated_at = now();
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_community_votes_sync
  AFTER INSERT OR UPDATE OR DELETE ON public.community_reply_votes
  FOR EACH ROW EXECUTE FUNCTION public.community_sync_vote_counts();

-- ═══════ RPC: aplicar voto idempotente (insert/update/delete) ═══════
CREATE OR REPLACE FUNCTION public.community_set_vote(
  _reply_id uuid,
  _vote text  -- 'util' | 'nao_util' | 'none'
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF _vote = 'none' THEN
    DELETE FROM public.community_reply_votes
     WHERE reply_id = _reply_id AND user_id = auth.uid();
  ELSIF _vote IN ('util', 'nao_util') THEN
    INSERT INTO public.community_reply_votes (reply_id, user_id, vote)
    VALUES (_reply_id, auth.uid(), _vote::public.community_vote_kind)
    ON CONFLICT (reply_id, user_id) DO UPDATE SET vote = EXCLUDED.vote;
  ELSE
    RAISE EXCEPTION 'Voto inválido: %', _vote;
  END IF;
END;
$$;

-- ═══════ RPC: garantir/atualizar engagement do usuário a partir das tabelas reais ═══════
CREATE OR REPLACE FUNCTION public.community_recompute_engagement(_user_id uuid)
RETURNS public.user_engagement
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sims integer := 0;
  v_props integer;
  v_ai integer;
  v_active_days integer;
  v_helpful integer := 0;
  v_cases integer := 0;
  v_replies integer := 0;
  v_score integer;
  v_level smallint;
  v_row public.user_engagement;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'user_id obrigatório';
  END IF;

  -- Apenas o próprio usuário ou admin pode recomputar.
  IF auth.uid() <> _user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Sem permissão para recomputar engagement de outro usuário';
  END IF;

  SELECT COUNT(*) INTO v_sims
    FROM public.analytics_events
   WHERE user_id = _user_id AND event_name IN ('simulation_completed','simulator_simulate');

  SELECT COUNT(*) INTO v_props FROM public.proposals WHERE user_id = _user_id;
  SELECT COUNT(*) INTO v_ai
    FROM public.analytics_events
   WHERE user_id = _user_id AND event_name IN ('ai_insight_generated','ai_copilot_used','sales_copilot_called');

  SELECT COUNT(DISTINCT date_trunc('day', created_at)) INTO v_active_days
    FROM public.analytics_events WHERE user_id = _user_id;

  SELECT COUNT(*) INTO v_cases FROM public.community_cases WHERE user_id = _user_id;
  SELECT COUNT(*) INTO v_replies FROM public.community_replies WHERE user_id = _user_id;

  SELECT COALESCE(SUM(r.helpful_count),0) INTO v_helpful
    FROM public.community_replies r WHERE r.user_id = _user_id;

  v_score := (v_sims * 2) + (v_props * 5) + (v_active_days * 3) + (v_ai * 2) + (v_helpful * 4);

  v_level := CASE
    WHEN v_score >= 250 THEN 4
    WHEN v_score >= 120 THEN 3
    WHEN v_score >= 50  THEN 2
    ELSE 1
  END;

  INSERT INTO public.user_engagement AS ue (
    user_id, score, level,
    simulations_count, proposals_count, ai_usage_count, active_days_count,
    helpful_replies_count, cases_created_count, replies_created_count,
    last_computed_at, updated_at
  ) VALUES (
    _user_id, v_score, v_level,
    v_sims, v_props, v_ai, v_active_days,
    v_helpful, v_cases, v_replies,
    now(), now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    score = EXCLUDED.score,
    level = EXCLUDED.level,
    simulations_count = EXCLUDED.simulations_count,
    proposals_count = EXCLUDED.proposals_count,
    ai_usage_count = EXCLUDED.ai_usage_count,
    active_days_count = EXCLUDED.active_days_count,
    helpful_replies_count = EXCLUDED.helpful_replies_count,
    cases_created_count = EXCLUDED.cases_created_count,
    replies_created_count = EXCLUDED.replies_created_count,
    last_computed_at = now(),
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.community_set_vote(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_recompute_engagement(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_user_level(uuid) TO authenticated;