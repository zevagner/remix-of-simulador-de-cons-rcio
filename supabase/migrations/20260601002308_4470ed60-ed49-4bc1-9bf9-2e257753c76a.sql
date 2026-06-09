-- M-1: bucket limits
UPDATE storage.buckets
   SET file_size_limit = 15728640, -- 15 MB
       allowed_mime_types = ARRAY['application/pdf']
 WHERE id = 'proposal-pdfs';

-- A-1: enforce owner on UPDATE/DELETE within tenant
DROP POLICY IF EXISTS "tenant: update pdfs by company membership" ON storage.objects;
DROP POLICY IF EXISTS "tenant: delete pdfs by company membership" ON storage.objects;

CREATE POLICY "tenant: update pdfs by company membership"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'proposal-pdfs'
  AND (storage.foldername(name))[1] = 'companies'
  AND is_company_member(((storage.foldername(name))[2])::uuid)
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'proposal-pdfs'
  AND (storage.foldername(name))[1] = 'companies'
  AND is_company_member(((storage.foldername(name))[2])::uuid)
  AND owner = auth.uid()
);

CREATE POLICY "tenant: delete pdfs by company membership"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'proposal-pdfs'
  AND (storage.foldername(name))[1] = 'companies'
  AND is_company_member(((storage.foldername(name))[2])::uuid)
  AND owner = auth.uid()
);

-- M-2: legacy policy not used (0 objects on legacy path)
DROP POLICY IF EXISTS "Users read own pdfs" ON storage.objects;