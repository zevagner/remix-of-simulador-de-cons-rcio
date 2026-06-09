ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_proposals_share_token ON public.proposals(share_token) WHERE share_token IS NOT NULL;