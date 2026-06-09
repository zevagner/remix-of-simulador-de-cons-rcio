
-- =====================================================================
-- HARDENING DE GOVERNANÇA — public.user_roles
-- Adiciona timestamps + autoria, tabela de trilha e trigger universal.
-- Não altera RLS de tabelas existentes nem regras de negócio.
-- =====================================================================

-- 1) Colunas de governança em user_roles -------------------------------
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by uuid NULL;

-- updated_at automático
DROP TRIGGER IF EXISTS trg_user_roles_set_updated_at ON public.user_roles;
CREATE TRIGGER trg_user_roles_set_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Tabela de trilha de auditoria de roles ----------------------------
CREATE TABLE IF NOT EXISTS public.role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('ROLE_GRANTED','ROLE_REVOKED','ROLE_CHANGED')),
  actor_user_id uuid NULL,
  target_user_id uuid NOT NULL,
  old_role text NULL,
  new_role text NULL,
  source text NOT NULL DEFAULT 'unknown',
  db_role text NULL,
  session_user_name text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_audit_log_target ON public.role_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_created_at ON public.role_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_event ON public.role_audit_log(event_type);

GRANT SELECT ON public.role_audit_log TO authenticated;
GRANT ALL ON public.role_audit_log TO service_role;

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Somente admins leem a trilha
DROP POLICY IF EXISTS "Admins can read role audit log" ON public.role_audit_log;
CREATE POLICY "Admins can read role audit log"
  ON public.role_audit_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Sem políticas de INSERT/UPDATE/DELETE para roles autenticadas:
-- escrita só via trigger SECURITY DEFINER ou service_role.

-- 3) Função de trigger universal --------------------------------------
CREATE OR REPLACE FUNCTION public.log_user_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event text;
  v_old text := NULL;
  v_new text := NULL;
  v_target uuid;
  v_source text;
  v_db_role text := current_user;
  v_session text := session_user;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event := 'ROLE_GRANTED';
    v_new := NEW.role::text;
    v_target := NEW.user_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_event := 'ROLE_CHANGED';
    v_old := OLD.role::text;
    v_new := NEW.role::text;
    v_target := NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    v_event := 'ROLE_REVOKED';
    v_old := OLD.role::text;
    v_target := OLD.user_id;
  END IF;

  -- Inferir origem da alteração
  v_source := CASE
    WHEN auth.uid() IS NOT NULL THEN 'app'
    WHEN v_db_role = 'service_role' THEN 'service_role'
    WHEN v_db_role = 'supabase_admin' THEN 'supabase_studio_or_sql'
    WHEN v_db_role = 'postgres' THEN 'migration_or_direct_sql'
    ELSE 'unknown:' || v_db_role
  END;

  INSERT INTO public.role_audit_log (
    event_type, actor_user_id, target_user_id,
    old_role, new_role, source, db_role, session_user_name, metadata
  ) VALUES (
    v_event, auth.uid(), v_target,
    v_old, v_new, v_source, v_db_role, v_session,
    jsonb_build_object('tg_op', TG_OP)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_user_roles_audit_ins ON public.user_roles;
DROP TRIGGER IF EXISTS trg_user_roles_audit_upd ON public.user_roles;
DROP TRIGGER IF EXISTS trg_user_roles_audit_del ON public.user_roles;

CREATE TRIGGER trg_user_roles_audit_ins
AFTER INSERT ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_user_role_change();

CREATE TRIGGER trg_user_roles_audit_upd
AFTER UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_user_role_change();

CREATE TRIGGER trg_user_roles_audit_del
AFTER DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_user_role_change();

-- 4) RPC administrativa: estado atual de admins -----------------------
CREATE OR REPLACE FUNCTION public.admin_list_admins()
RETURNS TABLE(
  user_id uuid,
  email text,
  nome text,
  role text,
  granted_at timestamptz,
  granted_by uuid,
  last_audit_source text,
  last_audit_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT
    ur.user_id,
    au.email::text,
    p.nome,
    ur.role::text,
    ur.created_at AS granted_at,
    ur.created_by AS granted_by,
    (SELECT ral.source FROM public.role_audit_log ral
       WHERE ral.target_user_id = ur.user_id
       ORDER BY ral.created_at DESC LIMIT 1) AS last_audit_source,
    (SELECT ral.created_at FROM public.role_audit_log ral
       WHERE ral.target_user_id = ur.user_id
       ORDER BY ral.created_at DESC LIMIT 1) AS last_audit_at
  FROM public.user_roles ur
  JOIN auth.users au ON au.id = ur.user_id
  LEFT JOIN public.profiles p ON p.user_id = ur.user_id
  WHERE ur.role = 'admin'
  ORDER BY au.email;
END;
$$;

-- 5) RPC administrativa: relatório histórico --------------------------
CREATE OR REPLACE FUNCTION public.admin_role_history(p_limit integer DEFAULT 500)
RETURNS TABLE(
  id uuid,
  event_type text,
  target_email text,
  target_user_id uuid,
  actor_email text,
  actor_user_id uuid,
  old_role text,
  new_role text,
  source text,
  db_role text,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT
    ral.id,
    ral.event_type,
    tu.email::text AS target_email,
    ral.target_user_id,
    au.email::text AS actor_email,
    ral.actor_user_id,
    ral.old_role,
    ral.new_role,
    ral.source,
    ral.db_role,
    ral.created_at
  FROM public.role_audit_log ral
  LEFT JOIN auth.users tu ON tu.id = ral.target_user_id
  LEFT JOIN auth.users au ON au.id = ral.actor_user_id
  ORDER BY ral.created_at DESC
  LIMIT GREATEST(LEAST(p_limit, 2000), 1);
END;
$$;
