-- ============================================================================
-- M3-F: CLEANUP & HARDENING FINAL
-- ============================================================================
-- 1) Storage legacy cleanup: keep SELECT on legacy paths (preserve old PDFs),
--    drop legacy INSERT/UPDATE/DELETE (new writes only via tenant path).
-- 2) Drop deprecated _org indexes (replaced by company-aware ones).
-- 3) Security definer hardening: REVOKE EXECUTE FROM anon on tenant helpers.
-- ============================================================================

-- ---------- 1. STORAGE LEGACY CLEANUP ----------
-- Keep "Users read own pdfs" (legacy SELECT) for backward access to {user_id}/*
-- Drop legacy write paths to force new writes through tenant scheme.
DROP POLICY IF EXISTS "Users write own pdfs"  ON storage.objects;
DROP POLICY IF EXISTS "Users update own pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own pdfs" ON storage.objects;

-- ---------- 2. DROP DEPRECATED _org INDEXES ----------
DROP INDEX IF EXISTS public.idx_audit_logs_org;
DROP INDEX IF EXISTS public.idx_post_sale_clients_org;
DROP INDEX IF EXISTS public.idx_post_sale_events_org;
DROP INDEX IF EXISTS public.idx_proposals_org;

-- ---------- 3. SECURITY DEFINER HARDENING ----------
-- These helpers are only meaningful for authenticated callers; revoke from anon.
REVOKE EXECUTE ON FUNCTION public.current_company_id()         FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_company_ids()        FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_company_member(uuid)      FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_company_admin(uuid)       FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role)     FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_approved(uuid)            FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_proposals_page(text, text, boolean, integer, integer, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_post_sale_clients_page(text, text, integer, integer, uuid)  FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_proposal_events_page(uuid, integer, integer, uuid)          FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_users_page(text, text, text, text, boolean, text, text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_users_with_email()       FROM anon;
REVOKE EXECUTE ON FUNCTION public.community_recompute_engagement(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.community_user_level(uuid)   FROM anon;
REVOKE EXECUTE ON FUNCTION public.community_set_vote(uuid, text) FROM anon;