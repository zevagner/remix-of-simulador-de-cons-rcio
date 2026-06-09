-- ============================================================
-- M3-A: RLS DUAL + RPCs TENANT-AWARE (BACKEND ONLY)
-- Sem alterar frontend, sem ativar MULTI_TENANT_RLS.
-- Estratégia: políticas adicionais PERMISSIVE que mantêm
-- (user_id = auth.uid()) AND (is_company_member(company_id))
-- → comportamento operacional idêntico hoje, defense-in-depth amanhã.
-- ============================================================

-- ----------------------------------------------------------------
-- 1) RLS DUAL — POLÍTICAS TENANT-AWARE (additivas, não restritivas)
-- ----------------------------------------------------------------
-- Visibilidade default mantida: consultor vê apenas os próprios registros.
-- Diferença vs legacy: também valida que company_id pertence a uma company
-- da qual o usuário é membro ativo (defesa adicional contra company_id inválido).
-- Quando MULTI_TENANT_RLS flip ocorrer (M3-E), legacy policies serão dropadas
-- e estas permanecerão como única camada de autorização.

-- proposals
CREATE POLICY "tenant: users select own proposals"
  ON public.proposals FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));

CREATE POLICY "tenant: users insert own proposals"
  ON public.proposals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));

CREATE POLICY "tenant: users update own proposals"
  ON public.proposals FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)))
  WITH CHECK (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));

CREATE POLICY "tenant: users delete own proposals"
  ON public.proposals FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));

-- post_sale_clients
CREATE POLICY "tenant: users select own post-sale clients"
  ON public.post_sale_clients FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));
CREATE POLICY "tenant: users insert own post-sale clients"
  ON public.post_sale_clients FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));
CREATE POLICY "tenant: users update own post-sale clients"
  ON public.post_sale_clients FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)))
  WITH CHECK (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));
CREATE POLICY "tenant: users delete own post-sale clients"
  ON public.post_sale_clients FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));

-- post_sale_events
CREATE POLICY "tenant: users select own post-sale events"
  ON public.post_sale_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));
CREATE POLICY "tenant: users insert own post-sale events"
  ON public.post_sale_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));
CREATE POLICY "tenant: users update own post-sale events"
  ON public.post_sale_events FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)))
  WITH CHECK (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));
CREATE POLICY "tenant: users delete own post-sale events"
  ON public.post_sale_events FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));

-- post_sale_bids
CREATE POLICY "tenant: users select own post-sale bids"
  ON public.post_sale_bids FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));
CREATE POLICY "tenant: users insert own post-sale bids"
  ON public.post_sale_bids FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));
CREATE POLICY "tenant: users update own post-sale bids"
  ON public.post_sale_bids FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)))
  WITH CHECK (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));
CREATE POLICY "tenant: users delete own post-sale bids"
  ON public.post_sale_bids FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));

-- proposal_events (apenas SELECT — INSERT é via trigger SECURITY DEFINER)
CREATE POLICY "tenant: users select own proposal events"
  ON public.proposal_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));

-- proposal_pdf_cache
CREATE POLICY "tenant: users select own pdf cache"
  ON public.proposal_pdf_cache FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));
CREATE POLICY "tenant: users insert own pdf cache"
  ON public.proposal_pdf_cache FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));
CREATE POLICY "tenant: users update own pdf cache"
  ON public.proposal_pdf_cache FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)))
  WITH CHECK (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));
CREATE POLICY "tenant: users delete own pdf cache"
  ON public.proposal_pdf_cache FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));

-- audit_logs (apenas SELECT/INSERT — append-only)
CREATE POLICY "tenant: users select own audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));
CREATE POLICY "tenant: users insert own audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));

-- analytics_events (apenas INSERT pelo usuário; SELECT já é admin-only)
CREATE POLICY "tenant: users insert own analytics events"
  ON public.analytics_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));

-- feedbacks (visibilidade pública resolvida não muda; apenas owner-scope)
CREATE POLICY "tenant: users insert own feedback"
  ON public.feedbacks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));
CREATE POLICY "tenant: users select own feedback"
  ON public.feedbacks FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));

-- user_engagement
CREATE POLICY "tenant: users select own engagement"
  ON public.user_engagement FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND (company_id IS NULL OR public.is_company_member(company_id)));

-- ----------------------------------------------------------------
-- 2) RPCs TENANT-AWARE — drop + recreate (signature change)
-- ----------------------------------------------------------------
-- Estratégia: novo parâmetro p_company_id opcional (default NULL).
-- Resolução: v_company := COALESCE(p_company_id, current_company_id()).
-- Filtro: user_id = auth.uid() AND (v_company IS NULL OR company_id = v_company OR company_id IS NULL).
-- Frontend continua chamando sem o parâmetro → comportamento idêntico.

-- list_proposals_page
DROP FUNCTION IF EXISTS public.list_proposals_page(text, text, boolean, integer, integer);

CREATE OR REPLACE FUNCTION public.list_proposals_page(
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_only_active boolean DEFAULT false,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_company_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid, client_name text, client_phone text, consortium_type text, credit_value numeric,
  term_months integer, installment numeric, total_cost numeric, status proposal_status,
  prospect_trigger text, next_action_type text, next_contact_date date, group_number integer,
  bid_percent numeric, bid_zone text, plan_type text, proposal_format text, notes text,
  created_at timestamp with time zone, updated_at timestamp with time zone, total_count bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_search text;
  v_limit int;
  v_company uuid;
BEGIN
  v_search := NULLIF(TRIM(COALESCE(p_search, '')), '');
  v_limit := LEAST(GREATEST(p_limit, 1), 200);
  v_company := COALESCE(p_company_id, public.current_company_id());

  RETURN QUERY
  WITH filtered AS (
    SELECT p.*
    FROM public.proposals p
    WHERE p.user_id = auth.uid()
      AND (v_company IS NULL OR p.company_id IS NULL OR p.company_id = v_company)
      AND (v_search IS NULL OR p.client_name ILIKE '%'||v_search||'%' OR p.client_phone ILIKE '%'||v_search||'%')
      AND (p_status IS NULL OR p.status::text = p_status)
      AND (NOT p_only_active OR p.status NOT IN ('fechado','perdido'))
  ),
  counted AS (SELECT f.*, COUNT(*) OVER () AS total_count FROM filtered f)
  SELECT
    c.id, c.client_name, c.client_phone, c.consortium_type, c.credit_value, c.term_months,
    c.installment, c.total_cost, c.status, c.prospect_trigger, c.next_action_type,
    c.next_contact_date, c.group_number, c.bid_percent, c.bid_zone, c.plan_type,
    c.proposal_format, c.notes, c.created_at, c.updated_at, c.total_count
  FROM counted c
  ORDER BY c.updated_at DESC, c.id ASC
  LIMIT v_limit OFFSET GREATEST(p_offset, 0);
END;
$function$;

-- list_post_sale_clients_page
DROP FUNCTION IF EXISTS public.list_post_sale_clients_page(text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.list_post_sale_clients_page(
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_company_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid, proposal_id uuid, client_name text, client_phone text, consortium_type text,
  credit_value numeric, term_months integer, group_number integer, status post_sale_status,
  priority post_sale_priority, group_entry_date date, contemplation_date date,
  last_contact_date date, plan_modality text, notes text,
  created_at timestamp with time zone, updated_at timestamp with time zone, total_count bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_search text;
  v_limit int;
  v_company uuid;
BEGIN
  v_search := NULLIF(TRIM(COALESCE(p_search, '')), '');
  v_limit := LEAST(GREATEST(p_limit, 1), 200);
  v_company := COALESCE(p_company_id, public.current_company_id());

  RETURN QUERY
  WITH filtered AS (
    SELECT psc.*
    FROM public.post_sale_clients psc
    WHERE psc.user_id = auth.uid()
      AND (v_company IS NULL OR psc.company_id IS NULL OR psc.company_id = v_company)
      AND (v_search IS NULL OR psc.client_name ILIKE '%'||v_search||'%' OR psc.client_phone ILIKE '%'||v_search||'%')
      AND (p_status IS NULL OR psc.status::text = p_status)
  ),
  counted AS (SELECT f.*, COUNT(*) OVER () AS total_count FROM filtered f)
  SELECT
    c.id, c.proposal_id, c.client_name, c.client_phone, c.consortium_type, c.credit_value,
    c.term_months, c.group_number, c.status, c.priority, c.group_entry_date,
    c.contemplation_date, c.last_contact_date, c.plan_modality, c.notes,
    c.created_at, c.updated_at, c.total_count
  FROM counted c
  ORDER BY c.updated_at DESC, c.id ASC
  LIMIT v_limit OFFSET GREATEST(p_offset, 0);
END;
$function$;

-- list_proposal_events_page
DROP FUNCTION IF EXISTS public.list_proposal_events_page(uuid, integer, integer);

CREATE OR REPLACE FUNCTION public.list_proposal_events_page(
  p_proposal_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0,
  p_company_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid, proposal_id uuid, event_type text, from_status proposal_status, to_status proposal_status,
  next_action_type text, next_action_notes text, next_contact_date date, metadata jsonb,
  created_at timestamp with time zone, total_count bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_limit int;
  v_company uuid;
BEGIN
  v_limit := LEAST(GREATEST(p_limit, 1), 200);
  v_company := COALESCE(p_company_id, public.current_company_id());

  RETURN QUERY
  WITH filtered AS (
    SELECT pe.*
    FROM public.proposal_events pe
    WHERE pe.user_id = auth.uid()
      AND (v_company IS NULL OR pe.company_id IS NULL OR pe.company_id = v_company)
      AND (p_proposal_id IS NULL OR pe.proposal_id = p_proposal_id)
  ),
  counted AS (SELECT f.*, COUNT(*) OVER () AS total_count FROM filtered f)
  SELECT
    c.id, c.proposal_id, c.event_type, c.from_status, c.to_status,
    c.next_action_type, c.next_action_notes, c.next_contact_date, c.metadata,
    c.created_at, c.total_count
  FROM counted c
  ORDER BY c.created_at DESC, c.id ASC
  LIMIT v_limit OFFSET GREATEST(p_offset, 0);
END;
$function$;