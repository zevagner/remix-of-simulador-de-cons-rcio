-- ─── Tabela de eventos do pipeline ───
CREATE TABLE public.proposal_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  from_status proposal_status,
  to_status proposal_status,
  next_action_type TEXT,
  next_action_notes TEXT,
  next_contact_date DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Validação de event_type
CREATE OR REPLACE FUNCTION public.validate_proposal_event_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type NOT IN ('created', 'status_change', 'next_action_set', 'notes_updated') THEN
    RAISE EXCEPTION 'event_type inválido: %', NEW.event_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_proposal_event_type
BEFORE INSERT OR UPDATE ON public.proposal_events
FOR EACH ROW EXECUTE FUNCTION public.validate_proposal_event_type();

-- Índices para queries comuns
CREATE INDEX idx_proposal_events_proposal_id ON public.proposal_events(proposal_id, created_at DESC);
CREATE INDEX idx_proposal_events_user_id ON public.proposal_events(user_id, created_at DESC);

-- ─── RLS ───
ALTER TABLE public.proposal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own proposal events"
ON public.proposal_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all proposal events"
ON public.proposal_events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Sem políticas de INSERT/UPDATE/DELETE para usuários: apenas triggers (SECURITY DEFINER) gravam.

-- ─── Trigger: registra criação ───
CREATE OR REPLACE FUNCTION public.log_proposal_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.proposal_events (
    proposal_id, user_id, event_type, to_status,
    next_action_type, next_action_notes, next_contact_date
  ) VALUES (
    NEW.id, NEW.user_id, 'created', NEW.status,
    NEW.next_action_type, NEW.next_action_notes, NEW.next_contact_date
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_proposal_created
AFTER INSERT ON public.proposals
FOR EACH ROW EXECUTE FUNCTION public.log_proposal_created();

-- ─── Trigger: registra mudanças (status / next_action) ───
CREATE OR REPLACE FUNCTION public.log_proposal_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mudança de status
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.proposal_events (
      proposal_id, user_id, event_type, from_status, to_status,
      next_action_type, next_action_notes, next_contact_date
    ) VALUES (
      NEW.id, NEW.user_id, 'status_change', OLD.status, NEW.status,
      NEW.next_action_type, NEW.next_action_notes, NEW.next_contact_date
    );
  -- Próxima ação alterada (sem mudança de status)
  ELSIF (NEW.next_action_type IS DISTINCT FROM OLD.next_action_type)
     OR (NEW.next_action_notes IS DISTINCT FROM OLD.next_action_notes)
     OR (NEW.next_contact_date IS DISTINCT FROM OLD.next_contact_date) THEN
    INSERT INTO public.proposal_events (
      proposal_id, user_id, event_type, to_status,
      next_action_type, next_action_notes, next_contact_date
    ) VALUES (
      NEW.id, NEW.user_id, 'next_action_set', NEW.status,
      NEW.next_action_type, NEW.next_action_notes, NEW.next_contact_date
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_proposal_changes
AFTER UPDATE ON public.proposals
FOR EACH ROW EXECUTE FUNCTION public.log_proposal_changes();