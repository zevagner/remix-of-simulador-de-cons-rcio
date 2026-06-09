REVOKE ALL ON FUNCTION public.community_user_level(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.community_recompute_engagement(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.community_set_vote(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.community_sync_case_reply_count() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.community_sync_vote_counts() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.community_user_level(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_recompute_engagement(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_set_vote(uuid, text) TO authenticated;