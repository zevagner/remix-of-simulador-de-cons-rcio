-- Rename old enum
ALTER TYPE public.proposal_status RENAME TO proposal_status_old;

-- Create new enum without legacy values
CREATE TYPE public.proposal_status AS ENUM (
  'prospeccao',
  'aguardando_retorno',
  'em_avaliacao',
  'proposta_ajustada',
  'fechado',
  'perdido'
);

-- Migrate the column
ALTER TABLE public.proposals
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.proposal_status USING status::text::public.proposal_status,
  ALTER COLUMN status SET DEFAULT 'prospeccao'::public.proposal_status;

-- Drop the old enum
DROP TYPE public.proposal_status_old;