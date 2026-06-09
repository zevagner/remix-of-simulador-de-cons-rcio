
-- ============================================================
-- SPRINT A — RLS PERFORMANCE OPTIMIZATION + INDEX CLEANUP
-- ============================================================
-- Strategy: wrap helper calls in (SELECT ...) so Postgres
-- evaluates them ONCE per query (InitPlan) instead of per row.
-- Reference: Supabase RLS perf docs — "Call functions with select".
-- ============================================================

-- ----- proposals -----
DROP POLICY IF EXISTS "tenant: users select own proposals" ON public.proposals;
DROP POLICY IF EXISTS "tenant: users insert own proposals" ON public.proposals;
DROP POLICY IF EXISTS "tenant: users update own proposals" ON public.proposals;
DROP POLICY IF EXISTS "tenant: users delete own proposals" ON public.proposals;

CREATE POLICY "tenant: users select own proposals" ON public.proposals
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));

CREATE POLICY "tenant: users insert own proposals" ON public.proposals
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id
            AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));

CREATE POLICY "tenant: users update own proposals" ON public.proposals
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())))
WITH CHECK ((SELECT auth.uid()) = user_id
            AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));

CREATE POLICY "tenant: users delete own proposals" ON public.proposals
FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));

-- ----- proposal_events -----
DROP POLICY IF EXISTS "tenant: users select own proposal events" ON public.proposal_events;
DROP POLICY IF EXISTS "Admins can view all proposal events" ON public.proposal_events;

CREATE POLICY "tenant: users select own proposal events" ON public.proposal_events
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));

CREATE POLICY "Admins can view all proposal events" ON public.proposal_events
FOR SELECT TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

-- ----- post_sale_clients -----
DROP POLICY IF EXISTS "tenant: users select own post-sale clients" ON public.post_sale_clients;
DROP POLICY IF EXISTS "tenant: users insert own post-sale clients" ON public.post_sale_clients;
DROP POLICY IF EXISTS "tenant: users update own post-sale clients" ON public.post_sale_clients;
DROP POLICY IF EXISTS "tenant: users delete own post-sale clients" ON public.post_sale_clients;

CREATE POLICY "tenant: users select own post-sale clients" ON public.post_sale_clients
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));
CREATE POLICY "tenant: users insert own post-sale clients" ON public.post_sale_clients
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id
            AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));
CREATE POLICY "tenant: users update own post-sale clients" ON public.post_sale_clients
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())))
WITH CHECK ((SELECT auth.uid()) = user_id
            AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));
CREATE POLICY "tenant: users delete own post-sale clients" ON public.post_sale_clients
FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));

-- ----- post_sale_events -----
DROP POLICY IF EXISTS "tenant: users select own post-sale events" ON public.post_sale_events;
DROP POLICY IF EXISTS "tenant: users insert own post-sale events" ON public.post_sale_events;
DROP POLICY IF EXISTS "tenant: users update own post-sale events" ON public.post_sale_events;
DROP POLICY IF EXISTS "tenant: users delete own post-sale events" ON public.post_sale_events;

CREATE POLICY "tenant: users select own post-sale events" ON public.post_sale_events
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));
CREATE POLICY "tenant: users insert own post-sale events" ON public.post_sale_events
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id
            AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));
CREATE POLICY "tenant: users update own post-sale events" ON public.post_sale_events
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())))
WITH CHECK ((SELECT auth.uid()) = user_id
            AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));
CREATE POLICY "tenant: users delete own post-sale events" ON public.post_sale_events
FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));

-- ----- post_sale_bids -----
DROP POLICY IF EXISTS "tenant: users select own post-sale bids" ON public.post_sale_bids;
DROP POLICY IF EXISTS "tenant: users insert own post-sale bids" ON public.post_sale_bids;
DROP POLICY IF EXISTS "tenant: users update own post-sale bids" ON public.post_sale_bids;
DROP POLICY IF EXISTS "tenant: users delete own post-sale bids" ON public.post_sale_bids;

CREATE POLICY "tenant: users select own post-sale bids" ON public.post_sale_bids
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));
CREATE POLICY "tenant: users insert own post-sale bids" ON public.post_sale_bids
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id
            AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));
CREATE POLICY "tenant: users update own post-sale bids" ON public.post_sale_bids
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())))
WITH CHECK ((SELECT auth.uid()) = user_id
            AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));
CREATE POLICY "tenant: users delete own post-sale bids" ON public.post_sale_bids
FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));

-- ----- analytics_events -----
DROP POLICY IF EXISTS "tenant: users insert own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can view all events" ON public.analytics_events;

CREATE POLICY "tenant: users insert own analytics events" ON public.analytics_events
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id
            AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));
CREATE POLICY "Admins can view all events" ON public.analytics_events
FOR SELECT TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

-- ----- audit_logs -----
DROP POLICY IF EXISTS "tenant: users insert own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "tenant: users select own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;

CREATE POLICY "tenant: users insert own audit logs" ON public.audit_logs
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id
            AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));
CREATE POLICY "tenant: users select own audit logs" ON public.audit_logs
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

-- ----- feedbacks -----
DROP POLICY IF EXISTS "tenant: users insert own feedback" ON public.feedbacks;
DROP POLICY IF EXISTS "tenant: users select own feedback" ON public.feedbacks;

CREATE POLICY "tenant: users insert own feedback" ON public.feedbacks
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id
            AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));
CREATE POLICY "tenant: users select own feedback" ON public.feedbacks
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));

-- ----- proposal_pdf_cache -----
DROP POLICY IF EXISTS "tenant: users select own pdf cache" ON public.proposal_pdf_cache;
DROP POLICY IF EXISTS "tenant: users insert own pdf cache" ON public.proposal_pdf_cache;
DROP POLICY IF EXISTS "tenant: users update own pdf cache" ON public.proposal_pdf_cache;
DROP POLICY IF EXISTS "tenant: users delete own pdf cache" ON public.proposal_pdf_cache;

CREATE POLICY "tenant: users select own pdf cache" ON public.proposal_pdf_cache
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));
CREATE POLICY "tenant: users insert own pdf cache" ON public.proposal_pdf_cache
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id
            AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));
CREATE POLICY "tenant: users update own pdf cache" ON public.proposal_pdf_cache
FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())))
WITH CHECK ((SELECT auth.uid()) = user_id
            AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));
CREATE POLICY "tenant: users delete own pdf cache" ON public.proposal_pdf_cache
FOR DELETE TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));

-- ----- user_engagement -----
DROP POLICY IF EXISTS "tenant: users select own engagement" ON public.user_engagement;
CREATE POLICY "tenant: users select own engagement" ON public.user_engagement
FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id
       AND (company_id IS NULL OR company_id IN (SELECT public.current_company_ids())));

-- ============================================================
-- INDEX CLEANUP — drop bare single-column indexes already
-- covered by composite (col, created_at DESC) variants.
-- ============================================================
DROP INDEX IF EXISTS public.idx_audit_logs_user_id;
DROP INDEX IF EXISTS public.idx_audit_logs_company;
DROP INDEX IF EXISTS public.idx_proposals_company;
DROP INDEX IF EXISTS public.idx_proposal_events_proposal_id; -- duplicate of _proposal_created
DROP INDEX IF EXISTS public.idx_proposal_events_company;
DROP INDEX IF EXISTS public.idx_post_sale_clients_company;
DROP INDEX IF EXISTS public.idx_post_sale_clients_user;
DROP INDEX IF EXISTS public.idx_post_sale_bids_company;
DROP INDEX IF EXISTS public.idx_post_sale_bids_client; -- covered by _client_date
DROP INDEX IF EXISTS public.idx_post_sale_bids_user;
DROP INDEX IF EXISTS public.idx_post_sale_events_company;
DROP INDEX IF EXISTS public.idx_post_sale_events_client; -- covered by _client_created
DROP INDEX IF EXISTS public.idx_post_sale_events_user;
DROP INDEX IF EXISTS public.idx_pdf_cache_company;
DROP INDEX IF EXISTS public.idx_feedbacks_company;
DROP INDEX IF EXISTS public.idx_analytics_events_company;
DROP INDEX IF EXISTS public.idx_user_engagement_company;
DROP INDEX IF EXISTS public.idx_proposals_next_contact; -- duplicate of _next_contact_date

-- Composite hot-path indexes matching dashboard/list queries:
-- (user_id, company_id, updated_at DESC)
CREATE INDEX IF NOT EXISTS idx_proposals_user_company_updated
  ON public.proposals (user_id, company_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_sale_clients_user_company_updated
  ON public.post_sale_clients (user_id, company_id, updated_at DESC);

ANALYZE public.proposals;
ANALYZE public.post_sale_clients;
ANALYZE public.post_sale_events;
ANALYZE public.post_sale_bids;
ANALYZE public.analytics_events;
ANALYZE public.audit_logs;
ANALYZE public.feedbacks;
ANALYZE public.proposal_events;
ANALYZE public.proposal_pdf_cache;
ANALYZE public.user_engagement;
