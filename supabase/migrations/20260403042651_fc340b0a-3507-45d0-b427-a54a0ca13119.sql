ALTER TYPE public.proposal_status ADD VALUE IF NOT EXISTS 'aguardando_retorno';
ALTER TYPE public.proposal_status ADD VALUE IF NOT EXISTS 'em_avaliacao';
ALTER TYPE public.proposal_status ADD VALUE IF NOT EXISTS 'proposta_ajustada';