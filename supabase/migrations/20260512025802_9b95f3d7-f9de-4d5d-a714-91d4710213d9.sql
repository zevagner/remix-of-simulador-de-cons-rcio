
-- Admin Executive Consolidation — Wave 1
-- Server-side aggregator RPCs to eliminate client-side truncation
-- and fix proposals=0 bug (RLS-restricted).

-- ─────────────────────────────────────────────────────────────
-- 1) get_user_proposal_counts: counts proposals per user
--    (admin-only, bypasses RLS via SECURITY DEFINER)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_proposal_counts(p_window_days integer DEFAULT 90)
RETURNS TABLE(user_id uuid, proposals_count bigint, last_proposal_at timestamptz)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;
  v_since := now() - make_interval(days => GREATEST(p_window_days, 1));
  RETURN QUERY
  SELECT p.user_id,
         COUNT(*)::bigint AS proposals_count,
         MAX(p.created_at) AS last_proposal_at
    FROM public.proposals p
   WHERE p.created_at >= v_since
   GROUP BY p.user_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2) get_admin_daily_logins: logins per day (last N days)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_daily_logins(p_days integer DEFAULT 7)
RETURNS TABLE(day date, logins bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;
  RETURN QUERY
  SELECT (created_at AT TIME ZONE 'UTC')::date AS day,
         COUNT(*)::bigint AS logins
    FROM public.analytics_events
   WHERE event_name = 'session_login'
     AND created_at >= now() - make_interval(days => GREATEST(p_days, 1))
   GROUP BY 1
   ORDER BY 1;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 3) get_admin_active_users: distinct active users per day
--    (excludes session_login/session_logout — real activity)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_active_users(p_days integer DEFAULT 7)
RETURNS TABLE(day date, active_users bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;
  RETURN QUERY
  SELECT (created_at AT TIME ZONE 'UTC')::date AS day,
         COUNT(DISTINCT user_id)::bigint AS active_users
    FROM public.analytics_events
   WHERE event_name NOT IN ('session_login','session_logout')
     AND created_at >= now() - make_interval(days => GREATEST(p_days, 1))
   GROUP BY 1
   ORDER BY 1;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 4) get_admin_module_usage: top modules by access count
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_module_usage(p_days integer DEFAULT 30)
RETURNS TABLE(module text, usage_count bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;
  RETURN QUERY
  SELECT COALESCE(event_data->>'module', 'unknown') AS module,
         COUNT(*)::bigint AS usage_count
    FROM public.analytics_events
   WHERE event_name = 'module_access'
     AND created_at >= now() - make_interval(days => GREATEST(p_days, 1))
   GROUP BY 1
   ORDER BY 2 DESC
   LIMIT 20;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 5) get_admin_funnel: counts of canonical funnel events
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_funnel(p_days integer DEFAULT 30)
RETURNS TABLE(event_name text, event_count bigint, distinct_users bigint)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;
  RETURN QUERY
  SELECT ae.event_name::text,
         COUNT(*)::bigint AS event_count,
         COUNT(DISTINCT ae.user_id)::bigint AS distinct_users
    FROM public.analytics_events ae
   WHERE ae.event_name IN (
           'simulation_generated',
           'proposal_tab_viewed',
           'proposal_generated',
           'proposal_copied',
           'argument_generated'
         )
     AND ae.created_at >= now() - make_interval(days => GREATEST(p_days, 1))
   GROUP BY ae.event_name;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 6) get_admin_engagement_events: aggregated engagement counters
--    per user (sessions/simulations/arguments) — replaces 30k row pull
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_admin_engagement_events(p_window_days integer DEFAULT 90, p_recent_days integer DEFAULT 30)
RETURNS TABLE(
  user_id uuid,
  sessions bigint,
  simulations bigint,
  arguments_copied bigint,
  last_activity_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since timestamptz;
  v_recent timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;
  v_since := now() - make_interval(days => GREATEST(p_window_days, 1));
  v_recent := now() - make_interval(days => GREATEST(p_recent_days, 1));
  RETURN QUERY
  SELECT ae.user_id,
         SUM( CASE WHEN ae.event_name IN ('session_login','session_logout','module_access')
                    AND ae.created_at >= v_recent THEN 1 ELSE 0 END )::bigint AS sessions,
         SUM( CASE WHEN ae.event_name IN ('simulation_generated','quick_sale_generated') THEN 1 ELSE 0 END )::bigint AS simulations,
         SUM( CASE WHEN ae.event_name IN ('argument_generated','argument_copied') THEN 1 ELSE 0 END )::bigint AS arguments_copied,
         MAX(ae.created_at) AS last_activity_at
    FROM public.analytics_events ae
   WHERE ae.created_at >= v_since
     AND ae.user_id IS NOT NULL
     AND ae.event_name IN (
       'session_login','session_logout','module_access',
       'simulation_generated','quick_sale_generated',
       'argument_generated','argument_copied'
     )
   GROUP BY ae.user_id;
END;
$$;
