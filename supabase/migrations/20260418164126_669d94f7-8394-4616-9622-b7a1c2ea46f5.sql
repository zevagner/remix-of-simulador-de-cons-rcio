-- 1) Cleanup leads terminais com next_action preenchido (legado)
UPDATE public.proposals
SET next_action_type = NULL,
    next_action_notes = NULL,
    next_contact_date = NULL
WHERE status IN ('fechado','perdido')
  AND (next_action_type IS NOT NULL
       OR next_action_notes IS NOT NULL
       OR next_contact_date IS NOT NULL);

-- 2) Share token: expiração + revogação
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS share_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS share_token_revoked_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_proposals_share_token_active
  ON public.proposals (share_token)
  WHERE share_token IS NOT NULL AND share_token_revoked_at IS NULL;

-- 3) Índice para paginação consistente (user_id, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_proposals_user_created
  ON public.proposals (user_id, created_at DESC);

-- 4) Trigger: ao entrar em status terminal, zera próxima ação automaticamente
CREATE OR REPLACE FUNCTION public.clear_next_action_on_terminal()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('fechado','perdido') THEN
    NEW.next_action_type := NULL;
    NEW.next_action_notes := NULL;
    NEW.next_contact_date := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clear_next_action_on_terminal ON public.proposals;
CREATE TRIGGER trg_clear_next_action_on_terminal
  BEFORE INSERT OR UPDATE OF status ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_next_action_on_terminal();