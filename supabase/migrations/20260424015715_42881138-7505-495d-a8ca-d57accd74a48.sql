-- ═══════════════════════════════════════════════════════════
-- MÓDULO PÓS-VENDA
-- ═══════════════════════════════════════════════════════════

-- Enum para status do consórcio pós-venda
CREATE TYPE public.post_sale_status AS ENUM (
  'ativo',
  'contemplado',
  'quitado',
  'inadimplente'
);

-- Enum para prioridade
CREATE TYPE public.post_sale_priority AS ENUM (
  'baixa',
  'normal',
  'alta'
);

-- ═══════════════════ TABELA: post_sale_clients ═══════════════════
CREATE TABLE public.post_sale_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  proposal_id UUID, -- vínculo opcional com a proposta original
  client_name TEXT NOT NULL,
  client_phone TEXT,
  consortium_type TEXT NOT NULL,
  credit_value NUMERIC NOT NULL,
  term_months INTEGER NOT NULL,
  group_number INTEGER,
  plan_modality TEXT NOT NULL DEFAULT 'tradicional',
  status public.post_sale_status NOT NULL DEFAULT 'ativo',
  priority public.post_sale_priority NOT NULL DEFAULT 'normal',
  group_entry_date DATE,
  contemplation_date DATE,
  last_contact_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_sale_clients_user ON public.post_sale_clients(user_id);
CREATE INDEX idx_post_sale_clients_status ON public.post_sale_clients(status);
CREATE INDEX idx_post_sale_clients_proposal ON public.post_sale_clients(proposal_id);

ALTER TABLE public.post_sale_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own post-sale clients"
  ON public.post_sale_clients FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all post-sale clients"
  ON public.post_sale_clients FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own post-sale clients"
  ON public.post_sale_clients FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own post-sale clients"
  ON public.post_sale_clients FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users delete own post-sale clients"
  ON public.post_sale_clients FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_post_sale_clients_updated_at
  BEFORE UPDATE ON public.post_sale_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════ TABELA: post_sale_events ═══════════════════
CREATE TABLE public.post_sale_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.post_sale_clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_sale_events_client ON public.post_sale_events(client_id);
CREATE INDEX idx_post_sale_events_user ON public.post_sale_events(user_id);

ALTER TABLE public.post_sale_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own post-sale events"
  ON public.post_sale_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all post-sale events"
  ON public.post_sale_events FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own post-sale events"
  ON public.post_sale_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own post-sale events"
  ON public.post_sale_events FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users delete own post-sale events"
  ON public.post_sale_events FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Validação de event_type
CREATE OR REPLACE FUNCTION public.validate_post_sale_event_type()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.event_type NOT IN (
    'created', 'group_entry', 'contact', 'bid_registered',
    'contemplation', 'status_change', 'note', 'opportunity'
  ) THEN
    RAISE EXCEPTION 'event_type inválido: %', NEW.event_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_post_sale_event_type_trg
  BEFORE INSERT OR UPDATE ON public.post_sale_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_post_sale_event_type();

-- ═══════════════════ TABELA: post_sale_bids ═══════════════════
CREATE TABLE public.post_sale_bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.post_sale_clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  bid_date DATE NOT NULL DEFAULT CURRENT_DATE,
  bid_value NUMERIC NOT NULL DEFAULT 0,
  bid_percent NUMERIC NOT NULL DEFAULT 0,
  bid_type TEXT NOT NULL DEFAULT 'livre', -- livre | fixo | embutido
  was_winner BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_sale_bids_client ON public.post_sale_bids(client_id);
CREATE INDEX idx_post_sale_bids_user ON public.post_sale_bids(user_id);

ALTER TABLE public.post_sale_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own post-sale bids"
  ON public.post_sale_bids FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all post-sale bids"
  ON public.post_sale_bids FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own post-sale bids"
  ON public.post_sale_bids FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own post-sale bids"
  ON public.post_sale_bids FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users delete own post-sale bids"
  ON public.post_sale_bids FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- ═══════════════════ TRIGGERS DE LOG AUTOMÁTICO ═══════════════════

-- Log de criação de cliente
CREATE OR REPLACE FUNCTION public.log_post_sale_client_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.post_sale_events (
    client_id, user_id, event_type, description, event_date, metadata
  ) VALUES (
    NEW.id, NEW.user_id, 'created',
    'Cliente migrado para o pós-venda',
    CURRENT_DATE,
    jsonb_build_object('proposal_id', NEW.proposal_id, 'status', NEW.status)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_post_sale_client_created_trg
  AFTER INSERT ON public.post_sale_clients
  FOR EACH ROW EXECUTE FUNCTION public.log_post_sale_client_created();

-- Log de mudança de status
CREATE OR REPLACE FUNCTION public.log_post_sale_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.post_sale_events (
      client_id, user_id, event_type, description, event_date, metadata
    ) VALUES (
      NEW.id, NEW.user_id, 'status_change',
      format('Status alterado de %s para %s', OLD.status, NEW.status),
      CURRENT_DATE,
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_post_sale_status_change_trg
  AFTER UPDATE ON public.post_sale_clients
  FOR EACH ROW EXECUTE FUNCTION public.log_post_sale_status_change();

-- Log de lance registrado
CREATE OR REPLACE FUNCTION public.log_post_sale_bid_registered()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.post_sale_events (
    client_id, user_id, event_type, description, event_date, metadata
  ) VALUES (
    NEW.client_id, NEW.user_id, 'bid_registered',
    format('Lance %s registrado: %s%%', NEW.bid_type, NEW.bid_percent),
    NEW.bid_date,
    jsonb_build_object(
      'bid_value', NEW.bid_value,
      'bid_percent', NEW.bid_percent,
      'bid_type', NEW.bid_type,
      'was_winner', NEW.was_winner
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER log_post_sale_bid_registered_trg
  AFTER INSERT ON public.post_sale_bids
  FOR EACH ROW EXECUTE FUNCTION public.log_post_sale_bid_registered();