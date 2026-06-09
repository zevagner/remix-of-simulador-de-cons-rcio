ALTER TABLE public.proposals
ADD COLUMN plan_type text NOT NULL DEFAULT 'tradicional';

ALTER TABLE public.proposals
ADD CONSTRAINT proposals_plan_type_check
CHECK (plan_type IN ('tradicional', 'agroflex', 'empresarialflex'));

-- Mesma constraint na tabela de pós-venda (campo já existe como plan_modality)
ALTER TABLE public.post_sale_clients
ADD CONSTRAINT post_sale_clients_plan_modality_check
CHECK (plan_modality IN ('tradicional', 'agroflex', 'empresarialflex'));