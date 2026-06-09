-- Quick Win 1: índices para reduzir leituras de tabela inteira (seq_scans)

CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
  ON public.profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_role 
  ON public.user_roles(user_id, role);

CREATE INDEX IF NOT EXISTS idx_proposal_events_proposal_created 
  ON public.proposal_events(proposal_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_sale_events_client_created 
  ON public.post_sale_events(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_sale_bids_client 
  ON public.post_sale_bids(client_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
  ON public.audit_logs(user_id, created_at DESC);