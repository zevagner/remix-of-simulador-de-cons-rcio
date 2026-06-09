-- CORREÇÃO 1: Recriar view com security_invoker = true
-- Precisa DROP + CREATE porque a ordem de colunas não pode mudar com CREATE OR REPLACE
DROP VIEW IF EXISTS public.assemblies_normalized;

CREATE VIEW public.assemblies_normalized
WITH (security_invoker = true)
AS
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
  g.id AS group_id
FROM public.groups g
JOIN public.assembly_results ar ON ar.group_id = g.id;

-- CORREÇÃO 3a: Alterar default do status de proposals
ALTER TABLE public.proposals
  ALTER COLUMN status SET DEFAULT 'prospeccao'::proposal_status;

-- CORREÇÃO 3b: Migrar propostas com status legado
UPDATE public.proposals SET status = 'aguardando_retorno' WHERE status = 'enviado';
UPDATE public.proposals SET status = 'em_avaliacao' WHERE status = 'em_negociacao';