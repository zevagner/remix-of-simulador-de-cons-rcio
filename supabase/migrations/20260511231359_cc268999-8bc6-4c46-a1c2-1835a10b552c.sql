-- M3-C: Storage tenant-aware (dual-read)
-- Adiciona policies tenant-aware para paths novos `companies/{companyId}/...`
-- Mantém policies legacy `{user_id}/...` intactas para compatibilidade.

-- READ: novo padrão tenant-aware
CREATE POLICY "tenant: read pdfs by company membership"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'proposal-pdfs'
  AND (storage.foldername(name))[1] = 'companies'
  AND public.is_company_member(((storage.foldername(name))[2])::uuid)
);

-- INSERT: novo padrão tenant-aware
CREATE POLICY "tenant: insert pdfs by company membership"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'proposal-pdfs'
  AND (storage.foldername(name))[1] = 'companies'
  AND public.is_company_member(((storage.foldername(name))[2])::uuid)
  AND owner = auth.uid()
);

-- UPDATE: novo padrão tenant-aware
CREATE POLICY "tenant: update pdfs by company membership"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'proposal-pdfs'
  AND (storage.foldername(name))[1] = 'companies'
  AND public.is_company_member(((storage.foldername(name))[2])::uuid)
)
WITH CHECK (
  bucket_id = 'proposal-pdfs'
  AND (storage.foldername(name))[1] = 'companies'
  AND public.is_company_member(((storage.foldername(name))[2])::uuid)
);

-- DELETE: novo padrão tenant-aware
CREATE POLICY "tenant: delete pdfs by company membership"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'proposal-pdfs'
  AND (storage.foldername(name))[1] = 'companies'
  AND public.is_company_member(((storage.foldername(name))[2])::uuid)
);

-- Índice auxiliar para resolução de cache por (proposal, company)
CREATE INDEX IF NOT EXISTS idx_pdf_cache_company_proposal
  ON public.proposal_pdf_cache (company_id, proposal_id);