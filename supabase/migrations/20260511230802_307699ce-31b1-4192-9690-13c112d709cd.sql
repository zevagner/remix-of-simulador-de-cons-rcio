-- ============================================================
-- M3-B: TRIGGERS DE LOG HERDAM company_id DO PARENT ROW
-- Backend-only. Zero alteração de frontend/UX.
-- Mantém set_company_id_from_profile como fallback.
-- ============================================================

-- ----------------------------------------------------------------
-- 1) PROPOSAL_EVENTS — herdar company_id da proposal (NEW)
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_proposal_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.proposal_events (
    proposal_id, user_id, company_id, event_type, to_status,
    next_action_type, next_action_notes, next_contact_date
  ) VALUES (
    NEW.id, NEW.user_id, NEW.company_id, 'created', NEW.status,
    NEW.next_action_type, NEW.next_action_notes, NEW.next_contact_date
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_proposal_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Mudança de status
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.proposal_events (
      proposal_id, user_id, company_id, event_type, from_status, to_status,
      next_action_type, next_action_notes, next_contact_date
    ) VALUES (
      NEW.id, NEW.user_id, NEW.company_id, 'status_change', OLD.status, NEW.status,
      NEW.next_action_type, NEW.next_action_notes, NEW.next_contact_date
    );
  -- Próxima ação alterada (sem mudança de status)
  ELSIF (NEW.next_action_type IS DISTINCT FROM OLD.next_action_type)
     OR (NEW.next_action_notes IS DISTINCT FROM OLD.next_action_notes)
     OR (NEW.next_contact_date IS DISTINCT FROM OLD.next_contact_date) THEN
    INSERT INTO public.proposal_events (
      proposal_id, user_id, company_id, event_type, to_status,
      next_action_type, next_action_notes, next_contact_date
    ) VALUES (
      NEW.id, NEW.user_id, NEW.company_id, 'next_action_set', NEW.status,
      NEW.next_action_type, NEW.next_action_notes, NEW.next_contact_date
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- ----------------------------------------------------------------
-- 2) POST_SALE_EVENTS — herdar do post_sale_client (NEW ou lookup)
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_post_sale_client_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.post_sale_events (
    client_id, user_id, company_id, event_type, description, event_date, metadata
  ) VALUES (
    NEW.id, NEW.user_id, NEW.company_id, 'created',
    'Cliente migrado para o pós-venda',
    CURRENT_DATE,
    jsonb_build_object('proposal_id', NEW.proposal_id, 'status', NEW.status)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_post_sale_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.post_sale_events (
      client_id, user_id, company_id, event_type, description, event_date, metadata
    ) VALUES (
      NEW.id, NEW.user_id, NEW.company_id, 'status_change',
      format('Status alterado de %s para %s', OLD.status, NEW.status),
      CURRENT_DATE,
      jsonb_build_object('from', OLD.status, 'to', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- ----------------------------------------------------------------
-- 3) POST_SALE_BIDS → POST_SALE_EVENTS — lookup do client parent
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_post_sale_bid_registered()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id uuid;
BEGIN
  -- Herda company_id do post_sale_client pai (fonte canônica),
  -- com fallback para o próprio bid (preenchido pelo trigger genérico).
  SELECT company_id INTO v_company_id
    FROM public.post_sale_clients
   WHERE id = NEW.client_id
   LIMIT 1;

  v_company_id := COALESCE(v_company_id, NEW.company_id);

  INSERT INTO public.post_sale_events (
    client_id, user_id, company_id, event_type, description, event_date, metadata
  ) VALUES (
    NEW.client_id, NEW.user_id, v_company_id, 'bid_registered',
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
$function$;

-- ----------------------------------------------------------------
-- 4) BACKFILL DEFENSIVO — eventos órfãos legados (zero esperado)
-- ----------------------------------------------------------------
-- Garantia de integridade: se algum evento histórico tiver company_id
-- divergente do parent, alinhar agora (a partir do parent canônico).

UPDATE public.proposal_events pe
   SET company_id = p.company_id
  FROM public.proposals p
 WHERE pe.proposal_id = p.id
   AND p.company_id IS NOT NULL
   AND (pe.company_id IS NULL OR pe.company_id IS DISTINCT FROM p.company_id);

UPDATE public.post_sale_events pse
   SET company_id = psc.company_id
  FROM public.post_sale_clients psc
 WHERE pse.client_id = psc.id
   AND psc.company_id IS NOT NULL
   AND (pse.company_id IS NULL OR pse.company_id IS DISTINCT FROM psc.company_id);

UPDATE public.post_sale_bids psb
   SET company_id = psc.company_id
  FROM public.post_sale_clients psc
 WHERE psb.client_id = psc.id
   AND psc.company_id IS NOT NULL
   AND (psb.company_id IS NULL OR psb.company_id IS DISTINCT FROM psc.company_id);