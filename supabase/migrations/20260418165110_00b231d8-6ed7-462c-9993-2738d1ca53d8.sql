-- Constraint de integridade: status terminal NUNCA pode ter próxima ação.
-- Defesa em profundidade: a trigger BEFORE limpa automaticamente, mas se algo
-- bypassar a trigger (ex.: SQL direto), o INSERT/UPDATE falha aqui.
ALTER TABLE public.proposals
  DROP CONSTRAINT IF EXISTS proposals_terminal_no_next_action;

ALTER TABLE public.proposals
  ADD CONSTRAINT proposals_terminal_no_next_action
  CHECK (
    status NOT IN ('fechado','perdido')
    OR (
      next_action_type IS NULL
      AND next_action_notes IS NULL
      AND next_contact_date IS NULL
    )
  );