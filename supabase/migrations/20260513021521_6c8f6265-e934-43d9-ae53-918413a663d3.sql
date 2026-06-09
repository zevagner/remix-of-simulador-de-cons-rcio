
CREATE TABLE IF NOT EXISTS public.assembly_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consortium_type text NOT NULL,
  months text[] NOT NULL DEFAULT '{}',
  rows_added integer NOT NULL DEFAULT 0,
  rows_updated integer NOT NULL DEFAULT 0,
  rows_pruned integer NOT NULL DEFAULT 0,
  diff_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  drift_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  import_token uuid,
  status text NOT NULL DEFAULT 'committed',
  rolled_back_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assembly_imports_created_at ON public.assembly_imports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assembly_imports_consortium_type ON public.assembly_imports (consortium_type);
CREATE INDEX IF NOT EXISTS idx_assembly_imports_status ON public.assembly_imports (status);

ALTER TABLE public.assembly_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view assembly imports"
ON public.assembly_imports FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert assembly imports"
ON public.assembly_imports FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update assembly imports"
ON public.assembly_imports FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
