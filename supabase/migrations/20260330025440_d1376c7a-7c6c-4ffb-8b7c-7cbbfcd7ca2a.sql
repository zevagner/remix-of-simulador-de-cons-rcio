
-- ═══════════════════════════════════════════════
-- FASE 1: Criação das tabelas normalizadas
-- ═══════════════════════════════════════════════

-- 1. Tabela de GRUPOS (dados estáveis do grupo)
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consortium_type text NOT NULL,
  group_number integer NOT NULL,
  total_term integer NOT NULL DEFAULT 0,
  remaining_term integer NOT NULL DEFAULT 0,
  participants integer NOT NULL DEFAULT 0,
  has_embedded_bid boolean NOT NULL DEFAULT false,
  embedded_bid_max_percent numeric NOT NULL DEFAULT 0,
  first_assembly_date text,
  next_assembly_date text,
  installment_due_date text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, consortium_type, group_number)
);

-- 2. Tabela de RESULTADOS DE ASSEMBLEIA (dados por assembleia)
CREATE TABLE public.assembly_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  assembly_month text NOT NULL,
  assembly_date timestamptz,
  credit_range text DEFAULT '',
  avg_bid_3_months numeric NOT NULL DEFAULT 0,
  min_bid_last_assembly numeric NOT NULL DEFAULT 0,
  max_bid_last_assembly numeric NOT NULL DEFAULT 0,
  contemplations_by_sorteio integer NOT NULL DEFAULT 0,
  contemplations_by_lance_livre integer NOT NULL DEFAULT 0,
  contemplations_by_lance_fixo integer NOT NULL DEFAULT 0,
  contemplations_by_lance integer NOT NULL DEFAULT 0,
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
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, assembly_month)
);

-- 3. Índices de performance
CREATE INDEX idx_groups_user_type ON public.groups(user_id, consortium_type);
CREATE INDEX idx_groups_number ON public.groups(group_number);
CREATE INDEX idx_assembly_results_group ON public.assembly_results(group_id);
CREATE INDEX idx_assembly_results_month ON public.assembly_results(assembly_month);

-- 4. RLS para groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can read groups"
  ON public.groups FOR SELECT TO authenticated
  USING (is_approved(auth.uid()));

CREATE POLICY "Admins can insert groups"
  ON public.groups FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update groups"
  ON public.groups FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete groups"
  ON public.groups FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 5. RLS para assembly_results
ALTER TABLE public.assembly_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved users can read assembly_results"
  ON public.assembly_results FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.groups g WHERE g.id = group_id AND is_approved(auth.uid())
  ));

CREATE POLICY "Admins can insert assembly_results"
  ON public.assembly_results FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.groups g WHERE g.id = group_id AND has_role(auth.uid(), 'admin')
  ));

CREATE POLICY "Admins can update assembly_results"
  ON public.assembly_results FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.groups g WHERE g.id = group_id AND has_role(auth.uid(), 'admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.groups g WHERE g.id = group_id AND has_role(auth.uid(), 'admin')
  ));

CREATE POLICY "Admins can delete assembly_results"
  ON public.assembly_results FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.groups g WHERE g.id = group_id AND has_role(auth.uid(), 'admin')
  ));

-- 6. View de compatibilidade (simula o formato antigo)
CREATE OR REPLACE VIEW public.assemblies_normalized AS
SELECT
  ar.id,
  g.user_id,
  g.consortium_type,
  g.group_number,
  ar.assembly_month,
  ar.assembly_date,
  g.has_embedded_bid,
  g.embedded_bid_max_percent,
  ar.credit_range,
  g.participants,
  g.total_term,
  g.remaining_term,
  g.first_assembly_date,
  g.next_assembly_date,
  g.installment_due_date,
  ar.avg_bid_3_months,
  ar.min_bid_last_assembly,
  ar.max_bid_last_assembly,
  ar.contemplations_by_sorteio,
  ar.contemplations_by_lance_livre,
  ar.contemplations_by_lance_fixo,
  ar.contemplations_by_lance,
  ar.contemplations_last_assembly,
  ar.contemplations_cancelled,
  ar.total_contemplations,
  ar.sorteio,
  ar.cancelled,
  ar.lance_fixo,
  ar.lance_livre,
  ar.min_bid_percentage,
  ar.avg_bid_percentage,
  ar.max_bid_percentage,
  ar.created_at,
  g.id as group_id
FROM public.assembly_results ar
JOIN public.groups g ON g.id = ar.group_id;

-- 7. Trigger para updated_at em groups
CREATE TRIGGER set_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
