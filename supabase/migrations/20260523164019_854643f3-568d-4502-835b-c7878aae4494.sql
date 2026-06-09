-- Fix privilege escalation: remove self-managed ALL policy on user_engagement.
-- Users could UPDATE their own `level` to bypass community access gating.
-- Reads remain via existing tenant SELECT policy; writes restricted to service role/admin.

DROP POLICY IF EXISTS "Service role manages engagement" ON public.user_engagement;

-- Allow admins to manage engagement rows from the app if needed.
CREATE POLICY "Admins manage engagement"
ON public.user_engagement
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
