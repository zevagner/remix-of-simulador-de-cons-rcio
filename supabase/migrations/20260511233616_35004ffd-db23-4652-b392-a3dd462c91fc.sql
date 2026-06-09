-- ════════════════════════════════════════════════════════════════════
-- ONDA M3-E — FLIP CONTROLADO PARA TENANT-SCOPED RLS
-- Drop apenas das policies legacy puramente user-scoped.
-- Tenant policies (tenant: ...) já existem e exigem
-- auth.uid() = user_id AND (company_id IS NULL OR is_company_member(company_id))
-- ════════════════════════════════════════════════════════════════════

-- proposals
DROP POLICY IF EXISTS "Users can view own proposals"   ON public.proposals;
DROP POLICY IF EXISTS "Users can insert own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can update own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can delete own proposals" ON public.proposals;

-- proposal_events (somente SELECT legacy; INSERT/UPDATE/DELETE já bloqueados)
DROP POLICY IF EXISTS "Users can view own proposal events" ON public.proposal_events;

-- post_sale_clients
DROP POLICY IF EXISTS "Users view own post-sale clients"   ON public.post_sale_clients;
DROP POLICY IF EXISTS "Users insert own post-sale clients" ON public.post_sale_clients;
DROP POLICY IF EXISTS "Users update own post-sale clients" ON public.post_sale_clients;
DROP POLICY IF EXISTS "Users delete own post-sale clients" ON public.post_sale_clients;

-- post_sale_events
DROP POLICY IF EXISTS "Users view own post-sale events"   ON public.post_sale_events;
DROP POLICY IF EXISTS "Users insert own post-sale events" ON public.post_sale_events;
DROP POLICY IF EXISTS "Users update own post-sale events" ON public.post_sale_events;
DROP POLICY IF EXISTS "Users delete own post-sale events" ON public.post_sale_events;

-- post_sale_bids
DROP POLICY IF EXISTS "Users view own post-sale bids"   ON public.post_sale_bids;
DROP POLICY IF EXISTS "Users insert own post-sale bids" ON public.post_sale_bids;
DROP POLICY IF EXISTS "Users update own post-sale bids" ON public.post_sale_bids;
DROP POLICY IF EXISTS "Users delete own post-sale bids" ON public.post_sale_bids;

-- proposal_pdf_cache
DROP POLICY IF EXISTS "Users view own pdf cache"   ON public.proposal_pdf_cache;
DROP POLICY IF EXISTS "Users insert own pdf cache" ON public.proposal_pdf_cache;
DROP POLICY IF EXISTS "Users update own pdf cache" ON public.proposal_pdf_cache;
DROP POLICY IF EXISTS "Users delete own pdf cache" ON public.proposal_pdf_cache;

-- analytics_events (apenas INSERT legacy existe; SELECT só admin)
DROP POLICY IF EXISTS "Users can insert own events" ON public.analytics_events;

-- audit_logs
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view own audit logs"   ON public.audit_logs;

-- feedbacks (mantém policies de notified update + leitura pública resolvida)
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.feedbacks;
DROP POLICY IF EXISTS "Users can view their own feedback"   ON public.feedbacks;

-- user_engagement (mantém Service role manages engagement para writes)
DROP POLICY IF EXISTS "Users view own engagement" ON public.user_engagement;