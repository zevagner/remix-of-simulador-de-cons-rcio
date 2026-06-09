CREATE OR REPLACE FUNCTION public.get_admin_users_page(
  p_search text DEFAULT NULL,
  p_role_filter text DEFAULT NULL,        -- 'admin' | 'user' | NULL (todos)
  p_approved_filter text DEFAULT NULL,    -- 'active' | 'pending' | NULL (todos)
  p_email_domain text DEFAULT NULL,       -- 'caixa' | 'external' | 'missing' | NULL
  p_new_only boolean DEFAULT false,       -- últimos 30 dias
  p_sort_key text DEFAULT 'date',         -- 'name' | 'email' | 'date' | 'role' | 'approved'
  p_sort_dir text DEFAULT 'desc',         -- 'asc' | 'desc'
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  nome text,
  email text,
  role text,
  approved boolean,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_search text;
  v_sort_dir text;
  v_sort_key text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  v_search := NULLIF(TRIM(COALESCE(p_search, '')), '');
  v_sort_dir := CASE WHEN LOWER(COALESCE(p_sort_dir,'desc')) = 'asc' THEN 'asc' ELSE 'desc' END;
  v_sort_key := LOWER(COALESCE(p_sort_key, 'date'));

  RETURN QUERY
  WITH base AS (
    SELECT
      p.id,
      p.user_id,
      p.nome,
      COALESCE(p.email, '') AS email,
      COALESCE(ur.role::text, 'user') AS role,
      COALESCE(p.approved, false) AS approved,
      p.created_at
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
  ),
  filtered AS (
    SELECT *
    FROM base b
    WHERE
      (v_search IS NULL OR b.nome ILIKE '%' || v_search || '%' OR b.email ILIKE '%' || v_search || '%')
      AND (p_role_filter IS NULL OR b.role = p_role_filter)
      AND (
        p_approved_filter IS NULL
        OR (p_approved_filter = 'active'  AND b.approved = true)
        OR (p_approved_filter = 'pending' AND b.approved = false)
      )
      AND (
        p_email_domain IS NULL
        OR (p_email_domain = 'caixa'    AND b.email ILIKE '%@caixa.gov.br')
        OR (p_email_domain = 'external' AND b.email <> '' AND b.email NOT ILIKE '%@caixa.gov.br')
        OR (p_email_domain = 'missing'  AND (b.email IS NULL OR b.email = ''))
      )
      AND (p_new_only = false OR b.created_at >= now() - interval '30 days')
  ),
  counted AS (
    SELECT f.*, COUNT(*) OVER () AS total_count
    FROM filtered f
  )
  SELECT
    c.id, c.user_id, c.nome, c.email, c.role, c.approved, c.created_at, c.total_count
  FROM counted c
  ORDER BY
    CASE WHEN v_sort_key = 'name'     AND v_sort_dir = 'asc'  THEN c.nome END ASC,
    CASE WHEN v_sort_key = 'name'     AND v_sort_dir = 'desc' THEN c.nome END DESC,
    CASE WHEN v_sort_key = 'email'    AND v_sort_dir = 'asc'  THEN c.email END ASC,
    CASE WHEN v_sort_key = 'email'    AND v_sort_dir = 'desc' THEN c.email END DESC,
    CASE WHEN v_sort_key = 'role'     AND v_sort_dir = 'asc'  THEN c.role END ASC,
    CASE WHEN v_sort_key = 'role'     AND v_sort_dir = 'desc' THEN c.role END DESC,
    CASE WHEN v_sort_key = 'approved' AND v_sort_dir = 'asc'  THEN c.approved::int END ASC,
    CASE WHEN v_sort_key = 'approved' AND v_sort_dir = 'desc' THEN c.approved::int END DESC,
    CASE WHEN v_sort_key = 'date'     AND v_sort_dir = 'asc'  THEN c.created_at END ASC,
    CASE WHEN v_sort_key = 'date'     AND v_sort_dir = 'desc' THEN c.created_at END DESC,
    -- tie-breakers estáveis
    c.nome ASC,
    c.created_at ASC,
    c.id ASC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
END;
$$;