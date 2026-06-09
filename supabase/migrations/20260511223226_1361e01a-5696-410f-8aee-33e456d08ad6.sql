-- ============================================================
-- ONDA M1 — FOUNDATION LAYER tenant-aware
-- Sem alterar RLS operacional, sem alterar comportamento.
-- ============================================================

-- 1. Rename organizations -> companies
ALTER TABLE public.organizations RENAME TO companies;

-- Recreate policies on companies (policies follow rename, but recreate to use clearer names)
-- (no-op: existing policies already moved with the table rename)

-- 2. Rename organization_id -> company_id em todas as tabelas operacionais
ALTER TABLE public.proposals          RENAME COLUMN organization_id TO company_id;
ALTER TABLE public.post_sale_clients  RENAME COLUMN organization_id TO company_id;
ALTER TABLE public.post_sale_events   RENAME COLUMN organization_id TO company_id;
ALTER TABLE public.post_sale_bids     RENAME COLUMN organization_id TO company_id;
ALTER TABLE public.proposal_events    RENAME COLUMN organization_id TO company_id;
ALTER TABLE public.audit_logs         RENAME COLUMN organization_id TO company_id;
ALTER TABLE public.analytics_events   RENAME COLUMN organization_id TO company_id;
ALTER TABLE public.profiles           RENAME COLUMN organization_id TO company_id;

-- 3. Enum de papéis locais
DO $$ BEGIN
  CREATE TYPE public.company_role AS ENUM ('owner','admin','manager','advisor','viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Tabela company_users
CREATE TABLE IF NOT EXISTS public.company_users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,
  role        public.company_role NOT NULL DEFAULT 'owner',
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_users_user   ON public.company_users(user_id) WHERE active;
CREATE INDEX IF NOT EXISTS idx_company_users_company ON public.company_users(company_id) WHERE active;

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own memberships"
  ON public.company_users FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage memberships"
  ON public.company_users FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Helpers SQL (reutilizáveis pela futura M3)
CREATE OR REPLACE FUNCTION public.is_company_member(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE company_id = _company_id AND user_id = auth.uid() AND active
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE company_id = _company_id
      AND user_id = auth.uid()
      AND active
      AND role IN ('owner','admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.current_company_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.company_users
  WHERE user_id = auth.uid() AND active;
$$;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.company_users
  WHERE user_id = auth.uid() AND active
  ORDER BY (role = 'owner') DESC, created_at ASC
  LIMIT 1;
$$;

-- 6. handle_new_user — cria profile + role + company própria + vínculo owner
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id uuid;
  v_nome text;
BEGIN
  v_nome := COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email);

  -- profile
  INSERT INTO public.profiles (user_id, nome, approved)
  VALUES (NEW.id, v_nome, true);

  -- role global
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- company própria (workspace pessoal)
  INSERT INTO public.companies (name, owner_user_id)
  VALUES (COALESCE(v_nome, 'Workspace'), NEW.id)
  RETURNING id INTO v_company_id;

  -- vínculo owner
  INSERT INTO public.company_users (company_id, user_id, role, active)
  VALUES (v_company_id, NEW.id, 'owner', true);

  -- backfill company_id no profile recém-criado
  UPDATE public.profiles SET company_id = v_company_id WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$;

-- 7. Backfill conservador para usuários existentes
DO $$
DECLARE
  r record;
  v_company_id uuid;
BEGIN
  FOR r IN
    SELECT p.user_id, p.nome
    FROM public.profiles p
    LEFT JOIN public.company_users cu ON cu.user_id = p.user_id AND cu.active
    WHERE cu.id IS NULL
  LOOP
    INSERT INTO public.companies (name, owner_user_id)
    VALUES (COALESCE(r.nome, 'Workspace'), r.user_id)
    RETURNING id INTO v_company_id;

    INSERT INTO public.company_users (company_id, user_id, role, active)
    VALUES (v_company_id, r.user_id, 'owner', true)
    ON CONFLICT DO NOTHING;

    UPDATE public.profiles SET company_id = v_company_id
     WHERE user_id = r.user_id AND company_id IS NULL;
  END LOOP;
END $$;