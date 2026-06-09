CREATE POLICY "Admins insert post-sale clients"
ON public.post_sale_clients
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));