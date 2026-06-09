-- Wave 3: inteligência consultiva coletiva
-- 1) Tabela de visualizações de caso (sinalização leve "X consultores viram este desfecho")
CREATE TABLE IF NOT EXISTS public.community_case_views (
  case_id uuid NOT NULL,
  user_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (case_id, user_id)
);

ALTER TABLE public.community_case_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users register own view"
  ON public.community_case_views
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view counts on visible cases"
  ON public.community_case_views
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.community_cases c
    WHERE c.id = community_case_views.case_id
      AND ((c.user_id = auth.uid())
           OR (public.is_approved(auth.uid())
               AND (c.is_private = false OR public.community_user_level(auth.uid()) >= 3)))
  ));

CREATE INDEX IF NOT EXISTS idx_community_case_views_case ON public.community_case_views(case_id);

-- 2) RPC: registrar visualização (idempotente)
CREATE OR REPLACE FUNCTION public.community_register_view(_case_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.community_case_views(case_id, user_id)
  VALUES (_case_id, auth.uid())
  ON CONFLICT (case_id, user_id) DO NOTHING;
END;
$$;

-- 3) RPC: casos parecidos (mesmo tipo + similaridade textual via trigram, prioriza resolvidos)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_community_cases_title_trgm
  ON public.community_cases USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_community_cases_summary_trgm
  ON public.community_cases USING gin (summary gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.community_similar_cases(
  _case_id uuid DEFAULT NULL,
  _consortium_type text DEFAULT NULL,
  _stage text DEFAULT NULL,
  _query text DEFAULT NULL,
  _limit int DEFAULT 5
)
RETURNS TABLE (
  id uuid, title text, summary text, status community_case_status,
  consortium_type text, stage text, reply_count integer,
  outcome text, outcome_kind text, helpful_count integer,
  view_count bigint, similarity real, created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_type text := _consortium_type;
  v_stage text := _stage;
  v_text text := COALESCE(_query, '');
BEGIN
  IF _case_id IS NOT NULL THEN
    SELECT c.consortium_type, c.stage, c.title || ' ' || c.summary
      INTO v_type, v_stage, v_text
      FROM public.community_cases c WHERE c.id = _case_id;
  END IF;

  RETURN QUERY
  SELECT c.id, c.title, c.summary, c.status,
         c.consortium_type, c.stage, c.reply_count,
         c.outcome, c.outcome_kind, c.helpful_count,
         (SELECT COUNT(*) FROM public.community_case_views v WHERE v.case_id = c.id)::bigint AS view_count,
         GREATEST(
           similarity(c.title, COALESCE(v_text,'')),
           similarity(c.summary, COALESCE(v_text,''))
         ) AS similarity,
         c.created_at
    FROM public.community_cases c
   WHERE (_case_id IS NULL OR c.id <> _case_id)
     AND public.is_approved(auth.uid())
     AND (c.is_private = false OR public.community_user_level(auth.uid()) >= 3 OR c.user_id = auth.uid())
     AND (
       (v_type IS NOT NULL AND c.consortium_type = v_type)
       OR (v_stage IS NOT NULL AND c.stage = v_stage)
       OR (v_text <> '' AND (c.title % v_text OR c.summary % v_text))
     )
   ORDER BY
     -- prioriza resolvidos com outcome aplicado_funcionou
     (c.outcome_kind = 'aplicou_funcionou')::int DESC,
     (c.status = 'resolvido')::int DESC,
     GREATEST(similarity(c.title, COALESCE(v_text,'')), similarity(c.summary, COALESCE(v_text,''))) DESC,
     c.helpful_count DESC,
     c.reply_count DESC
   LIMIT GREATEST(1, LEAST(_limit, 20));
END;
$$;

-- 4) RPC: busca consultiva com filtros inteligentes
CREATE OR REPLACE FUNCTION public.community_search(
  _query text DEFAULT NULL,
  _consortium_type text DEFAULT NULL,
  _stage text DEFAULT NULL,
  _outcome_kind text DEFAULT NULL,
  _only_resolved boolean DEFAULT false,
  _only_unanswered boolean DEFAULT false,
  _limit int DEFAULT 30
)
RETURNS TABLE (
  id uuid, title text, summary text, status community_case_status,
  consortium_type text, stage text, reply_count integer,
  outcome text, outcome_kind text, helpful_count integer,
  view_count bigint, created_at timestamptz, updated_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_q text := NULLIF(TRIM(COALESCE(_query,'')), '');
BEGIN
  RETURN QUERY
  SELECT c.id, c.title, c.summary, c.status,
         c.consortium_type, c.stage, c.reply_count,
         c.outcome, c.outcome_kind, c.helpful_count,
         (SELECT COUNT(*) FROM public.community_case_views v WHERE v.case_id = c.id)::bigint AS view_count,
         c.created_at, c.updated_at
    FROM public.community_cases c
   WHERE public.is_approved(auth.uid())
     AND (c.is_private = false OR public.community_user_level(auth.uid()) >= 3 OR c.user_id = auth.uid())
     AND (_consortium_type IS NULL OR c.consortium_type = _consortium_type)
     AND (_stage IS NULL OR c.stage = _stage)
     AND (_outcome_kind IS NULL OR c.outcome_kind = _outcome_kind)
     AND (NOT _only_resolved OR c.status = 'resolvido')
     AND (NOT _only_unanswered OR c.reply_count = 0)
     AND (
       v_q IS NULL OR
       c.title ILIKE '%'||v_q||'%' OR c.summary ILIKE '%'||v_q||'%' OR
       COALESCE(c.outcome,'') ILIKE '%'||v_q||'%'
     )
   ORDER BY
     (c.status = 'resolvido' AND c.outcome_kind = 'aplicou_funcionou')::int DESC,
     c.helpful_count DESC,
     c.updated_at DESC
   LIMIT GREATEST(1, LEAST(_limit, 100));
END;
$$;

-- 5) RPC: casos referência (curadoria leve, determinística)
CREATE OR REPLACE FUNCTION public.community_reference_cases(_limit int DEFAULT 10)
RETURNS TABLE (
  id uuid, title text, summary text, consortium_type text, stage text,
  outcome text, outcome_kind text, reply_count integer, helpful_count integer,
  accepted_replies bigint, view_count bigint, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.id, c.title, c.summary, c.consortium_type, c.stage,
         c.outcome, c.outcome_kind, c.reply_count, c.helpful_count,
         (SELECT COUNT(*) FROM public.community_replies r WHERE r.case_id = c.id AND r.is_accepted)::bigint AS accepted_replies,
         (SELECT COUNT(*) FROM public.community_case_views v WHERE v.case_id = c.id)::bigint AS view_count,
         c.created_at
    FROM public.community_cases c
   WHERE public.is_approved(auth.uid())
     AND c.is_private = false
     AND c.status = 'resolvido'
     AND c.outcome_kind IN ('aplicou_funcionou')
     AND EXISTS (SELECT 1 FROM public.community_replies r WHERE r.case_id = c.id AND r.is_accepted)
   ORDER BY c.helpful_count DESC, c.reply_count DESC, c.updated_at DESC
   LIMIT GREATEST(1, LEAST(_limit, 50));
$$;

-- 6) RPC: padrões recorrentes (objeções/estratégias por tipo+stage nos últimos 180d)
CREATE OR REPLACE FUNCTION public.community_recurring_patterns(_days int DEFAULT 180, _limit int DEFAULT 8)
RETURNS TABLE (
  consortium_type text, stage text, total_cases bigint, resolved_cases bigint,
  worked_cases bigint, avg_helpful numeric
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(c.consortium_type, 'geral') AS consortium_type,
         COALESCE(c.stage, 'geral') AS stage,
         COUNT(*)::bigint AS total_cases,
         SUM((c.status = 'resolvido')::int)::bigint AS resolved_cases,
         SUM((c.outcome_kind = 'aplicou_funcionou')::int)::bigint AS worked_cases,
         ROUND(AVG(c.helpful_count)::numeric, 1) AS avg_helpful
    FROM public.community_cases c
   WHERE public.is_approved(auth.uid())
     AND c.is_private = false
     AND c.created_at >= now() - make_interval(days => GREATEST(_days, 30))
   GROUP BY 1, 2
  HAVING COUNT(*) >= 2
   ORDER BY total_cases DESC, worked_cases DESC
   LIMIT GREATEST(1, LEAST(_limit, 20));
$$;

-- 7) RPC: feedback humano leve para autores ("seu caso ajudou X consultores")
CREATE OR REPLACE FUNCTION public.community_case_impact(_case_id uuid)
RETURNS TABLE (view_count bigint, helpful_replies bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.community_case_views v WHERE v.case_id = _case_id)::bigint,
    (SELECT COALESCE(SUM(GREATEST(r.helpful_count,0)),0)
       FROM public.community_replies r WHERE r.case_id = _case_id)::bigint;
$$;