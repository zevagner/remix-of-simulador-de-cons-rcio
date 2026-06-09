-- 1. Add new columns to feedbacks
ALTER TABLE public.feedbacks
  ADD COLUMN IF NOT EXISTS user_notified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_summary TEXT;

-- 2. Trigger: when status flips to 'resolvido', reset user_notified so the user gets notified once
CREATE OR REPLACE FUNCTION public.reset_feedback_user_notified()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'resolvido' AND (OLD.status IS DISTINCT FROM 'resolvido') THEN
    NEW.user_notified = false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reset_feedback_user_notified ON public.feedbacks;
CREATE TRIGGER trg_reset_feedback_user_notified
  BEFORE UPDATE ON public.feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_feedback_user_notified();

-- 3. Allow users to update user_notified on their own feedbacks (acknowledge)
CREATE POLICY "Users can mark own feedback as notified"
ON public.feedbacks
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Public view exposing only safe columns for "Recent improvements" on the login screen
CREATE OR REPLACE VIEW public.public_improvements
WITH (security_invoker = true)
AS
SELECT
  id,
  type,
  public_summary,
  resolved_at
FROM public.feedbacks
WHERE status = 'resolvido'
  AND is_public = true
  AND public_summary IS NOT NULL
  AND resolved_at IS NOT NULL;

-- Allow anonymous and authenticated reads on the public view
GRANT SELECT ON public.public_improvements TO anon, authenticated;

-- Ensure underlying table allows the view's SELECT for anon (security_invoker uses caller perms)
-- We add a permissive SELECT policy scoped to public/resolved rows only.
CREATE POLICY "Anyone can read public resolved feedback"
ON public.feedbacks
FOR SELECT
TO anon, authenticated
USING (status = 'resolvido' AND is_public = true AND public_summary IS NOT NULL);

-- 5. Index to speed up the post-login notification query
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_status_notified
  ON public.feedbacks (user_id, status)
  WHERE status = 'resolvido' AND user_notified = false;

CREATE INDEX IF NOT EXISTS idx_feedbacks_public_resolved
  ON public.feedbacks (resolved_at DESC)
  WHERE is_public = true AND status = 'resolvido';