
CREATE TABLE public.assemblies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consortium_type text NOT NULL CHECK (consortium_type IN ('imobiliario', 'auto', 'pesados')),
  group_number integer NOT NULL,
  assembly_month text NOT NULL,
  assembly_date timestamptz,
  has_embedded_bid boolean NOT NULL DEFAULT false,
  embedded_bid_max_percent numeric NOT NULL DEFAULT 0,
  credit_range text DEFAULT '',
  participants integer NOT NULL DEFAULT 0,
  total_term integer NOT NULL DEFAULT 0,
  remaining_term integer NOT NULL DEFAULT 0,
  first_assembly_date text,
  next_assembly_date text,
  installment_due_date text,
  avg_bid_3_months numeric NOT NULL DEFAULT 0,
  min_bid_last_assembly numeric NOT NULL DEFAULT 0,
  max_bid_last_assembly numeric NOT NULL DEFAULT 0,
  contemplations_by_sorteio integer NOT NULL DEFAULT 0,
  contemplations_by_lance_livre integer NOT NULL DEFAULT 0,
  contemplations_by_lance_fixo integer NOT NULL DEFAULT 0,
  contemplations_last_assembly integer NOT NULL DEFAULT 0,
  contemplations_cancelled integer NOT NULL DEFAULT 0,
  total_contemplations integer NOT NULL DEFAULT 0,
  sorteio integer NOT NULL DEFAULT 0,
  cancelled integer NOT NULL DEFAULT 0,
  lance_fixo integer NOT NULL DEFAULT 0,
  lance_livre integer NOT NULL DEFAULT 0,
  min_bid_percentage numeric NOT NULL DEFAULT 0,
  avg_bid_percentage numeric NOT NULL DEFAULT 0,
  max_bid_percentage numeric NOT NULL DEFAULT 0,
  contemplations_by_lance integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (consortium_type, group_number, assembly_month)
);

ALTER TABLE public.assemblies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can read assemblies"
  ON public.assemblies FOR SELECT
  TO authenticated
  USING (public.is_approved(auth.uid()));

CREATE POLICY "Admins can insert assemblies"
  ON public.assemblies FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update assemblies"
  ON public.assemblies FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete assemblies"
  ON public.assemblies FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_assemblies_type_group ON public.assemblies (consortium_type, group_number);
CREATE INDEX idx_assemblies_month ON public.assemblies (assembly_month);
