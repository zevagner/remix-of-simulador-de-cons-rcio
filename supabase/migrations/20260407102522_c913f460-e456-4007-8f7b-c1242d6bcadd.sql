
-- 1. Drop the redundant ALL policy
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- 2. Drop existing INSERT policy
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;

-- 3. Recreate as RESTRICTIVE (correct syntax: AS RESTRICTIVE before FOR)
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Add restrictive UPDATE policy
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;

CREATE POLICY "Only admins can update roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
