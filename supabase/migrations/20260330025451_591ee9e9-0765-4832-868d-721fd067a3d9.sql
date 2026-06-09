
-- Fix: Set view to use INVOKER security (respects querying user's RLS)
ALTER VIEW public.assemblies_normalized SET (security_invoker = on);
