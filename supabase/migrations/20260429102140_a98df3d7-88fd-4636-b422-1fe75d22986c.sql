CREATE OR REPLACE FUNCTION public.get_users_with_email()
RETURNS TABLE (
  user_id uuid,
  email text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT u.id AS user_id, u.email::text
  FROM auth.users u;
END;
$$;

REVOKE ALL ON FUNCTION public.get_users_with_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_users_with_email() TO authenticated;