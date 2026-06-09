CREATE INDEX IF NOT EXISTS idx_proposal_pdf_cache_proposal_id
  ON public.proposal_pdf_cache(proposal_id);