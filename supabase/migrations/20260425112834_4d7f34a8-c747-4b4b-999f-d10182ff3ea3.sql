-- 1. Remover duplicatas existentes (mantém o mais antigo por proposal_id)
DELETE FROM public.post_sale_clients a
USING public.post_sale_clients b
WHERE a.proposal_id IS NOT NULL
  AND a.proposal_id = b.proposal_id
  AND a.created_at > b.created_at;

-- 2. Constraint UNIQUE em proposal_id (permite múltiplos NULL, bloqueia duplicatas reais)
ALTER TABLE public.post_sale_clients
ADD CONSTRAINT post_sale_clients_proposal_id_unique UNIQUE (proposal_id);