
-- ============================================================
-- ONDA M2 — Tenant propagation (retry, com bypass de triggers no backfill)
-- ============================================================

-- 1) Colunas faltantes
ALTER TABLE public.proposal_pdf_cache ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.feedbacks         ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.user_engagement   ADD COLUMN IF NOT EXISTS company_id uuid;

-- 2) Backfill (bypassa triggers de validação/auditoria — apenas dados, sem efeito colateral)
SET LOCAL session_replication_role = replica;

UPDATE public.proposals p
   SET company_id = pr.company_id
  FROM public.profiles pr
 WHERE pr.user_id = p.user_id AND p.company_id IS NULL AND pr.company_id IS NOT NULL;

UPDATE public.proposal_events e
   SET company_id = pr.company_id
  FROM public.profiles pr
 WHERE pr.user_id = e.user_id AND e.company_id IS NULL AND pr.company_id IS NOT NULL;

UPDATE public.post_sale_clients c
   SET company_id = pr.company_id
  FROM public.profiles pr
 WHERE pr.user_id = c.user_id AND c.company_id IS NULL AND pr.company_id IS NOT NULL;

UPDATE public.post_sale_events e
   SET company_id = pr.company_id
  FROM public.profiles pr
 WHERE pr.user_id = e.user_id AND e.company_id IS NULL AND pr.company_id IS NOT NULL;

UPDATE public.post_sale_bids b
   SET company_id = pr.company_id
  FROM public.profiles pr
 WHERE pr.user_id = b.user_id AND b.company_id IS NULL AND pr.company_id IS NOT NULL;

UPDATE public.audit_logs a
   SET company_id = pr.company_id
  FROM public.profiles pr
 WHERE pr.user_id = a.user_id AND a.company_id IS NULL AND pr.company_id IS NOT NULL;

UPDATE public.analytics_events ae
   SET company_id = pr.company_id
  FROM public.profiles pr
 WHERE pr.user_id = ae.user_id AND ae.company_id IS NULL AND pr.company_id IS NOT NULL;

UPDATE public.proposal_pdf_cache c
   SET company_id = pr.company_id
  FROM public.profiles pr
 WHERE pr.user_id = c.user_id AND c.company_id IS NULL AND pr.company_id IS NOT NULL;

UPDATE public.feedbacks f
   SET company_id = pr.company_id
  FROM public.profiles pr
 WHERE pr.user_id = f.user_id AND f.company_id IS NULL AND pr.company_id IS NOT NULL;

UPDATE public.user_engagement ue
   SET company_id = pr.company_id
  FROM public.profiles pr
 WHERE pr.user_id = ue.user_id AND ue.company_id IS NULL AND pr.company_id IS NOT NULL;

SET LOCAL session_replication_role = origin;

-- 3) Trigger genérica de auto-preenchimento
CREATE OR REPLACE FUNCTION public.set_company_id_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NEW.company_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT company_id INTO NEW.company_id
      FROM public.profiles
     WHERE user_id = NEW.user_id
     LIMIT 1;
  END IF;
  RETURN NEW;
END;
$fn$;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'proposals','proposal_events',
    'post_sale_clients','post_sale_events','post_sale_bids',
    'audit_logs','analytics_events',
    'proposal_pdf_cache','feedbacks','user_engagement'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_set_company_id ON public.%I;', t);
    EXECUTE format(
      'CREATE TRIGGER trg_set_company_id
         BEFORE INSERT ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_profile();', t);
  END LOOP;
END$$;

-- 4) Índices tenant-aware
CREATE INDEX IF NOT EXISTS idx_proposals_company           ON public.proposals(company_id);
CREATE INDEX IF NOT EXISTS idx_proposals_company_user      ON public.proposals(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_company_updated   ON public.proposals(company_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_proposal_events_company         ON public.proposal_events(company_id);
CREATE INDEX IF NOT EXISTS idx_proposal_events_company_created ON public.proposal_events(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_sale_clients_company         ON public.post_sale_clients(company_id);
CREATE INDEX IF NOT EXISTS idx_post_sale_clients_company_user    ON public.post_sale_clients(company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_post_sale_clients_company_updated ON public.post_sale_clients(company_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_sale_events_company         ON public.post_sale_events(company_id);
CREATE INDEX IF NOT EXISTS idx_post_sale_events_company_created ON public.post_sale_events(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_sale_bids_company        ON public.post_sale_bids(company_id);
CREATE INDEX IF NOT EXISTS idx_post_sale_bids_company_client ON public.post_sale_bids(company_id, client_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_company         ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created ON public.audit_logs(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_company         ON public.analytics_events(company_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_company_created ON public.analytics_events(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_company_event   ON public.analytics_events(company_id, event_name);

CREATE INDEX IF NOT EXISTS idx_pdf_cache_company          ON public.proposal_pdf_cache(company_id);
CREATE INDEX IF NOT EXISTS idx_pdf_cache_company_proposal ON public.proposal_pdf_cache(company_id, proposal_id);
CREATE INDEX IF NOT EXISTS idx_pdf_cache_company_hash     ON public.proposal_pdf_cache(company_id, content_hash);

CREATE INDEX IF NOT EXISTS idx_feedbacks_company         ON public.feedbacks(company_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_company_created ON public.feedbacks(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_engagement_company   ON public.user_engagement(company_id);
