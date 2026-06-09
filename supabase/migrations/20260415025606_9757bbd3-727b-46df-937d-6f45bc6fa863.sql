-- Drop existing policies for UPDATE and DELETE
DROP POLICY IF EXISTS "Users can delete own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can update own proposals" ON public.proposals;

-- Recreate DELETE policy: owner OR admin
CREATE POLICY "Users can delete own proposals"
ON public.proposals
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Recreate UPDATE policy: owner OR admin
CREATE POLICY "Users can update own proposals"
ON public.proposals
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));