-- Onda 2: Próxima Ação Obrigatória
-- Adiciona campos estruturados para "qual a próxima ação para este lead?"

ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS next_action_type text,
  ADD COLUMN IF NOT EXISTS next_action_notes text;

-- Validação leve via trigger (evita CHECK constraint imutável):
-- aceita apenas valores conhecidos OU NULL.
CREATE OR REPLACE FUNCTION public.validate_next_action_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.next_action_type IS NOT NULL
     AND NEW.next_action_type NOT IN ('ligar', 'whatsapp', 'enviar_proposta', 'reuniao', 'follow_up', 'outro') THEN
    RAISE EXCEPTION 'next_action_type inválido: %', NEW.next_action_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_next_action_type_trigger ON public.proposals;
CREATE TRIGGER validate_next_action_type_trigger
BEFORE INSERT OR UPDATE OF next_action_type ON public.proposals
FOR EACH ROW EXECUTE FUNCTION public.validate_next_action_type();

-- Índice para alimentar a DailyAgenda com filtro por próxima ação pendente
CREATE INDEX IF NOT EXISTS idx_proposals_next_contact_date
  ON public.proposals (user_id, next_contact_date)
  WHERE next_contact_date IS NOT NULL;