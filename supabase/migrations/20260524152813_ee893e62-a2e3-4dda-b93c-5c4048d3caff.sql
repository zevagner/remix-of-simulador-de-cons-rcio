-- Security M4 (Audit 7): server-side triggers para garantir auditoria
-- de proposals e post_sale_clients mesmo se o client falhar em chamar logAction().
--
-- Adaptado ao schema REAL da tabela audit_logs:
--   (user_id, company_id, action, entity, entity_id, metadata, created_at)
-- Não existem colunas table_name/record_id/old_data/new_data — todos os
-- detalhes vão em metadata (jsonb).
--
-- SECURITY DEFINER: roda como owner, contornando o RLS WITH CHECK que exige
-- user_id = auth.uid() — o trigger atua mesmo em deletes em cascata.

CREATE OR REPLACE FUNCTION public.log_proposal_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := COALESCE(auth.uid(), NEW.user_id, OLD.user_id);
  v_company uuid := COALESCE(NEW.company_id, OLD.company_id);
  v_meta jsonb := '{}'::jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_meta := jsonb_build_object('op', 'delete', 'old', to_jsonb(OLD));
  ELSIF TG_OP = 'UPDATE' THEN
    v_meta := jsonb_build_object(
      'op', 'update',
      'status_from', OLD.status,
      'status_to', NEW.status,
      'client_name', NEW.client_name
    );
  ELSE
    v_meta := jsonb_build_object('op', 'insert', 'status', NEW.status, 'client_name', NEW.client_name);
  END IF;

  INSERT INTO public.audit_logs (user_id, company_id, action, entity, entity_id, metadata)
  VALUES (
    v_actor,
    v_company,
    'proposal.' || lower(TG_OP),
    'proposals',
    COALESCE(NEW.id, OLD.id),
    v_meta
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_proposals ON public.proposals;
CREATE TRIGGER trg_audit_proposals
  AFTER INSERT OR UPDATE OR DELETE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.log_proposal_change();


CREATE OR REPLACE FUNCTION public.log_post_sale_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := COALESCE(auth.uid(), NEW.user_id, OLD.user_id);
  v_company uuid := COALESCE(NEW.company_id, OLD.company_id);
  v_meta jsonb := '{}'::jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_meta := jsonb_build_object('op', 'delete', 'old', to_jsonb(OLD));
  ELSIF TG_OP = 'UPDATE' THEN
    v_meta := jsonb_build_object(
      'op', 'update',
      'status_from', OLD.status,
      'status_to', NEW.status,
      'priority_from', OLD.priority,
      'priority_to', NEW.priority,
      'client_name', NEW.client_name
    );
  ELSE
    v_meta := jsonb_build_object('op', 'insert', 'status', NEW.status, 'client_name', NEW.client_name);
  END IF;

  INSERT INTO public.audit_logs (user_id, company_id, action, entity, entity_id, metadata)
  VALUES (
    v_actor,
    v_company,
    'post_sale_client.' || lower(TG_OP),
    'post_sale_clients',
    COALESCE(NEW.id, OLD.id),
    v_meta
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_post_sale_clients ON public.post_sale_clients;
CREATE TRIGGER trg_audit_post_sale_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.post_sale_clients
  FOR EACH ROW EXECUTE FUNCTION public.log_post_sale_change();
