
REVOKE EXECUTE ON FUNCTION public.get_user_proposal_counts(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_admin_daily_logins(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_admin_active_users(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_admin_module_usage(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_admin_funnel(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_admin_engagement_events(integer, integer) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_user_proposal_counts(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_daily_logins(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_active_users(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_module_usage(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_funnel(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_engagement_events(integer, integer) TO authenticated;
