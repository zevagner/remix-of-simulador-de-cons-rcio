-- Isolamento total: admin é usuário comum nos módulos operacionais.
-- Mantém SELECT global apenas em analytics_events (necessário para o módulo Admin).

-- ── proposals ──
DROP POLICY IF EXISTS "Admins can view all proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can update own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can delete own proposals" ON public.proposals;

CREATE POLICY "Users can update own proposals"
  ON public.proposals FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own proposals"
  ON public.proposals FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── post_sale_clients ──
DROP POLICY IF EXISTS "Admins view all post-sale clients" ON public.post_sale_clients;
DROP POLICY IF EXISTS "Admins insert post-sale clients" ON public.post_sale_clients;
DROP POLICY IF EXISTS "Users update own post-sale clients" ON public.post_sale_clients;
DROP POLICY IF EXISTS "Users delete own post-sale clients" ON public.post_sale_clients;

CREATE POLICY "Users update own post-sale clients"
  ON public.post_sale_clients FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own post-sale clients"
  ON public.post_sale_clients FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── post_sale_events ──
DROP POLICY IF EXISTS "Admins view all post-sale events" ON public.post_sale_events;
DROP POLICY IF EXISTS "Users update own post-sale events" ON public.post_sale_events;
DROP POLICY IF EXISTS "Users delete own post-sale events" ON public.post_sale_events;

CREATE POLICY "Users update own post-sale events"
  ON public.post_sale_events FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own post-sale events"
  ON public.post_sale_events FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── post_sale_bids ──
DROP POLICY IF EXISTS "Admins view all post-sale bids" ON public.post_sale_bids;
DROP POLICY IF EXISTS "Users update own post-sale bids" ON public.post_sale_bids;
DROP POLICY IF EXISTS "Users delete own post-sale bids" ON public.post_sale_bids;

CREATE POLICY "Users update own post-sale bids"
  ON public.post_sale_bids FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own post-sale bids"
  ON public.post_sale_bids FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- analytics_events: mantém "Admins can view all events" (necessário para Dashboard/Analytics/Funnel).
-- profiles, user_roles, feedbacks, admin_logs, assemblies: mantidos (acesso global é parte do módulo Admin).