
-- Proposal status enum
CREATE TYPE public.proposal_status AS ENUM ('enviado', 'em_negociacao', 'fechado', 'perdido');

-- Proposals table
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  client_name TEXT NOT NULL DEFAULT '',
  credit_value NUMERIC NOT NULL,
  term_months INTEGER NOT NULL,
  installment NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  consortium_type TEXT NOT NULL,
  group_number INTEGER,
  bid_percent NUMERIC,
  bid_zone TEXT,
  status proposal_status NOT NULL DEFAULT 'enviado',
  proposal_content TEXT NOT NULL,
  proposal_format TEXT NOT NULL DEFAULT 'whatsapp',
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Users can view their own proposals
CREATE POLICY "Users can view own proposals"
  ON public.proposals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own proposals
CREATE POLICY "Users can insert own proposals"
  ON public.proposals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own proposals
CREATE POLICY "Users can update own proposals"
  ON public.proposals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own proposals
CREATE POLICY "Users can delete own proposals"
  ON public.proposals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all proposals
CREATE POLICY "Admins can view all proposals"
  ON public.proposals FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
