CREATE OR REPLACE FUNCTION public.community_user_levels(p_user_ids uuid[])
RETURNS TABLE(user_id uuid, level int)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT uid AS user_id, public.community_user_level(uid) AS level
  FROM unnest(p_user_ids) AS uid;
$$;

REVOKE EXECUTE ON FUNCTION public.community_user_levels(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_user_levels(uuid[]) TO authenticated;