-- ════════════════════════════════════════════════════════════════════
-- ONDA DE ESCALA: multi-tenant nullable + cache PDF + paginação RPC
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Tabela organizations (vazia, compat) ───────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own org"
  ON public.organizations FOR ALL
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Admins manage all orgs"
  ON public.organizations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ─── 2. organization_id nullable nas tabelas operacionais ──────────
ALTER TABLE public.proposals          ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE public.post_sale_clients  ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE public.post_sale_events   ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE public.post_sale_bids     ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE public.proposal_events    ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE public.audit_logs         ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE public.analytics_events   ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE public.profiles           ADD COLUMN IF NOT EXISTS organization_id uuid;

CREATE INDEX IF NOT EXISTS idx_proposals_org           ON public.proposals(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_post_sale_clients_org   ON public.post_sale_clients(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_post_sale_events_org    ON public.post_sale_events(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_org          ON public.audit_logs(organization_id) WHERE organization_id IS NOT NULL;

-- ─── 3. Cache de PDF (1 registro por proposta) ─────────────────────
CREATE TABLE IF NOT EXISTS public.proposal_pdf_cache (
  proposal_id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  content_hash text NOT NULL,
  filename text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_pdf_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own pdf cache"
  ON public.proposal_pdf_cache FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own pdf cache"
  ON public.proposal_pdf_cache FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own pdf cache"
  ON public.proposal_pdf_cache FOR UPDATE
  TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own pdf cache"
  ON public.proposal_pdf_cache FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Invalidação automática: ao atualizar a proposta, limpa cache.
CREATE OR REPLACE FUNCTION public.invalidate_pdf_cache_on_proposal_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.proposal_pdf_cache WHERE proposal_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invalidate_pdf_cache ON public.proposals;
CREATE TRIGGER trg_invalidate_pdf_cache
AFTER UPDATE ON public.proposals
FOR EACH ROW
WHEN (
  OLD.proposal_content IS DISTINCT FROM NEW.proposal_content
  OR OLD.credit_value  IS DISTINCT FROM NEW.credit_value
  OR OLD.term_months   IS DISTINCT FROM NEW.term_months
  OR OLD.installment   IS DISTINCT FROM NEW.installment
  OR OLD.total_cost    IS DISTINCT FROM NEW.total_cost
  OR OLD.bid_percent   IS DISTINCT FROM NEW.bid_percent
)
EXECUTE FUNCTION public.invalidate_pdf_cache_on_proposal_change();

-- ─── 4. Storage bucket privado para PDFs ───────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-pdfs', 'proposal-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS por pasta = user_id (path: <user_id>/<proposal_id>.pdf)
DROP POLICY IF EXISTS "Users read own pdfs"  ON storage.objects;
DROP POLICY IF EXISTS "Users write own pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Users update own pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own pdfs" ON storage.objects;

CREATE POLICY "Users read own pdfs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'proposal-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users write own pdfs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'proposal-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own pdfs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'proposal-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own pdfs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'proposal-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ─── 5. RPCs de paginação server-side ──────────────────────────────

-- Propostas paginadas
CREATE OR REPLACE FUNCTION public.list_proposals_page(
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_only_active boolean DEFAULT false,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  client_name text,
  client_phone text,
  consortium_type text,
  credit_value numeric,
  term_months int,
  installment numeric,
  total_cost numeric,
  status proposal_status,
  prospect_trigger text,
  next_action_type text,
  next_contact_date date,
  group_number int,
  bid_percent numeric,
  bid_zone text,
  plan_type text,
  proposal_format text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_search text;
  v_limit int;
BEGIN
  v_search := NULLIF(TRIM(COALESCE(p_search, '')), '');
  v_limit := LEAST(GREATEST(p_limit, 1), 200); -- HARD CAP 200/página

  RETURN QUERY
  WITH filtered AS (
    SELECT p.*
    FROM public.proposals p
    WHERE p.user_id = auth.uid()
      AND (v_search IS NULL OR p.client_name ILIKE '%'||v_search||'%' OR p.client_phone ILIKE '%'||v_search||'%')
      AND (p_status IS NULL OR p.status::text = p_status)
      AND (NOT p_only_active OR p.status NOT IN ('fechado','perdido'))
  ),
  counted AS (
    SELECT f.*, COUNT(*) OVER () AS total_count FROM filtered f
  )
  SELECT
    c.id, c.client_name, c.client_phone, c.consortium_type, c.credit_value, c.term_months,
    c.installment, c.total_cost, c.status, c.prospect_trigger, c.next_action_type,
    c.next_contact_date, c.group_number, c.bid_percent, c.bid_zone, c.plan_type,
    c.proposal_format, c.notes, c.created_at, c.updated_at, c.total_count
  FROM counted c
  ORDER BY c.updated_at DESC, c.id ASC
  LIMIT v_limit OFFSET GREATEST(p_offset, 0);
END;
$$;

-- Clientes pós-venda paginados
CREATE OR REPLACE FUNCTION public.list_post_sale_clients_page(
  p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  proposal_id uuid,
  client_name text,
  client_phone text,
  consortium_type text,
  credit_value numeric,
  term_months int,
  group_number int,
  status post_sale_status,
  priority post_sale_priority,
  group_entry_date date,
  contemplation_date date,
  last_contact_date date,
  plan_modality text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_search text;
  v_limit int;
BEGIN
  v_search := NULLIF(TRIM(COALESCE(p_search, '')), '');
  v_limit := LEAST(GREATEST(p_limit, 1), 200);

  RETURN QUERY
  WITH filtered AS (
    SELECT psc.*
    FROM public.post_sale_clients psc
    WHERE psc.user_id = auth.uid()
      AND (v_search IS NULL OR psc.client_name ILIKE '%'||v_search||'%' OR psc.client_phone ILIKE '%'||v_search||'%')
      AND (p_status IS NULL OR psc.status::text = p_status)
  ),
  counted AS (
    SELECT f.*, COUNT(*) OVER () AS total_count FROM filtered f
  )
  SELECT
    c.id, c.proposal_id, c.client_name, c.client_phone, c.consortium_type, c.credit_value,
    c.term_months, c.group_number, c.status, c.priority, c.group_entry_date,
    c.contemplation_date, c.last_contact_date, c.plan_modality, c.notes,
    c.created_at, c.updated_at, c.total_count
  FROM counted c
  ORDER BY c.updated_at DESC, c.id ASC
  LIMIT v_limit OFFSET GREATEST(p_offset, 0);
END;
$$;

-- Eventos da proposta paginados (histórico)
CREATE OR REPLACE FUNCTION public.list_proposal_events_page(
  p_proposal_id uuid DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  proposal_id uuid,
  event_type text,
  from_status proposal_status,
  to_status proposal_status,
  next_action_type text,
  next_action_notes text,
  next_contact_date date,
  metadata jsonb,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit int;
BEGIN
  v_limit := LEAST(GREATEST(p_limit, 1), 200);

  RETURN QUERY
  WITH filtered AS (
    SELECT pe.*
    FROM public.proposal_events pe
    WHERE pe.user_id = auth.uid()
      AND (p_proposal_id IS NULL OR pe.proposal_id = p_proposal_id)
  ),
  counted AS (
    SELECT f.*, COUNT(*) OVER () AS total_count FROM filtered f
  )
  SELECT
    c.id, c.proposal_id, c.event_type, c.from_status, c.to_status,
    c.next_action_type, c.next_action_notes, c.next_contact_date, c.metadata,
    c.created_at, c.total_count
  FROM counted c
  ORDER BY c.created_at DESC, c.id ASC
  LIMIT v_limit OFFSET GREATEST(p_offset, 0);
END;
$$;