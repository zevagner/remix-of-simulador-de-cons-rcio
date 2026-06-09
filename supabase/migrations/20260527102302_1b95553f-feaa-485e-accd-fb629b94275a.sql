-- 1) Move extensions to a dedicated schema (preserves OIDs, indexes and defaults)
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
             WHERE e.extname = 'pg_trgm' AND n.nspname = 'public') THEN
    EXECUTE 'ALTER EXTENSION pg_trgm SET SCHEMA extensions';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
             WHERE e.extname = 'pgcrypto' AND n.nspname = 'public') THEN
    EXECUTE 'ALTER EXTENSION pgcrypto SET SCHEMA extensions';
  END IF;
END $$;

-- 2) Update search_path of functions that reference pg_trgm operators/functions unqualified
ALTER FUNCTION public.community_similar_cases(uuid, text, text, text, integer)
  SET search_path = public, extensions;

ALTER FUNCTION public.community_recurring_patterns(integer, integer)
  SET search_path = public, extensions;

ALTER FUNCTION public.community_reference_cases(integer)
  SET search_path = public, extensions;

-- 3) Revoke EXECUTE from anon on functions that require authentication
REVOKE EXECUTE ON FUNCTION public.current_company_ids() FROM anon;
REVOKE EXECUTE ON FUNCTION public.community_user_level(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.community_user_levels(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.toggle_case_like(uuid) FROM anon;