
-- ═══════════════════════════════════════════════════════════════
-- ONDA 3 — Bloqueio servidor-side de regras de prospecção
-- ═══════════════════════════════════════════════════════════════

-- 1) Trigger de validação: prospect_trigger nunca pode ser 'nao_identificado'
--    (vale para INSERT e UPDATE; mensagem clara para a UI)
CREATE OR REPLACE FUNCTION public.validate_proposal_business_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Regra 1: prospect_trigger obrigatório
  IF NEW.prospect_trigger IS NULL OR NEW.prospect_trigger = 'nao_identificado' THEN
    RAISE EXCEPTION 'PROSPECT_TRIGGER_REQUIRED: Selecione o motivo do cliente (gatilho de prospecção) antes de salvar a proposta.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Regra 2: ao mover proposta para fora de 'prospeccao' (estados ativos),
  -- next_action_type passa a ser obrigatório. Estados terminais (fechado/perdido)
  -- são limpos por outro trigger e não exigem ação.
  IF TG_OP = 'UPDATE'
     AND NEW.status IN ('aguardando_resposta','em_avaliacao','enviada','reuniao_marcada')
     AND NEW.next_action_type IS NULL THEN
    RAISE EXCEPTION 'NEXT_ACTION_REQUIRED: Defina a próxima ação (ligar, WhatsApp, reunião, etc.) antes de avançar a proposta.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_proposal_business_rules ON public.proposals;
CREATE TRIGGER trg_validate_proposal_business_rules
  BEFORE INSERT OR UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_proposal_business_rules();

-- 2) Remover o default 'nao_identificado' para forçar especificação explícita.
--    Linhas existentes permanecem inalteradas (a coluna continua NOT NULL).
ALTER TABLE public.proposals
  ALTER COLUMN prospect_trigger DROP DEFAULT;
