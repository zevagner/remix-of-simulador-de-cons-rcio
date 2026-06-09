
-- Performance indices for high-traffic tables
CREATE INDEX IF NOT EXISTS idx_access_logs_user_timestamp ON public.access_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created ON public.analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created ON public.analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_user_created ON public.proposals(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_proposals_share_token ON public.proposals(share_token) WHERE share_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_assemblies_type_group_month ON public.assemblies(consortium_type, group_number, assembly_month);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
