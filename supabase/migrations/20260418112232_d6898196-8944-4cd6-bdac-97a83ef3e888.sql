CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created
ON public.analytics_events (user_id, created_at DESC);