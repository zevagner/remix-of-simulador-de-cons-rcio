-- ════════ 1. Anti privilege escalation em profiles ════════
CREATE OR REPLACE FUNCTION public.prevent_profile_self_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approved IS DISTINCT FROM OLD.approved
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar o status de aprovação';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_self_approval_trigger ON public.profiles;

CREATE TRIGGER prevent_profile_self_approval_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_self_approval();

-- ════════ 2. Realtime channel access control ════════
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can subscribe to own channel" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can broadcast to own channel" ON realtime.messages;

CREATE POLICY "Authenticated can subscribe to own channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'user:' || auth.uid()::text
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Authenticated can broadcast to own channel"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() = 'user:' || auth.uid()::text
  OR public.has_role(auth.uid(), 'admin')
);