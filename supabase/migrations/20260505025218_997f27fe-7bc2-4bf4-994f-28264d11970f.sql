
CREATE OR REPLACE FUNCTION public.validate_proposal_business_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.prospect_trigger IS NULL OR NEW.prospect_trigger = 'nao_identificado' THEN
    RAISE EXCEPTION 'PROSPECT_TRIGGER_REQUIRED: Selecione o motivo do cliente (gatilho de prospecção) antes de salvar a proposta.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF TG_OP = 'UPDATE'
     AND NEW.status::text IN ('aguardando_retorno','em_avaliacao','proposta_ajustada')
     AND NEW.next_action_type IS NULL THEN
    RAISE EXCEPTION 'NEXT_ACTION_REQUIRED: Defina a próxima ação (ligar, WhatsApp, reunião, etc.) antes de avançar a proposta.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$function$;
