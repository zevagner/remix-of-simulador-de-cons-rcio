-- Tabela de alertas de segurança (admin-only)
CREATE TABLE public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  alert_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed boolean NOT NULL DEFAULT false
);

-- GRANTs: tabela admin-only (RLS bloqueia não-admins).
-- service_role obrigatório para a RPC SECURITY DEFINER e edges.
GRANT SELECT, INSERT, UPDATE ON public.security_alerts TO authenticated;
GRANT ALL ON public.security_alerts TO service_role;

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security alerts"
  ON public.security_alerts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert security alerts"
  ON public.security_alerts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update security alerts"
  ON public.security_alerts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_security_alerts_reviewed_created
  ON public.security_alerts (reviewed, created_at DESC);
CREATE INDEX idx_security_alerts_user_created
  ON public.security_alerts (user_id, created_at DESC);
CREATE INDEX idx_security_alerts_type_created
  ON public.security_alerts (alert_type, created_at DESC);

-- RPC: qualquer usuário autenticado pode registrar um alerta sobre si mesmo
-- ou disparado pelo cliente. SECURITY DEFINER permite a escrita mesmo que o
-- caller não seja admin (a RLS exige admin para INSERT direto). Validação
-- mínima: p_user_id e tipo não nulos; tamanho razoável.
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_alert_type text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_user_id IS NULL OR p_alert_type IS NULL OR length(p_alert_type) = 0 THEN
    RAISE EXCEPTION 'parâmetros inválidos';
  END IF;
  IF length(p_alert_type) > 80 OR length(COALESCE(p_description, '')) > 1000 THEN
    RAISE EXCEPTION 'campo excede tamanho máximo';
  END IF;

  INSERT INTO public.security_alerts (user_id, alert_type, description, metadata)
  VALUES (p_user_id, p_alert_type, COALESCE(p_description, ''), COALESCE(p_metadata, '{}'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.log_security_event(uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_security_event(uuid, text, text, jsonb) TO authenticated;