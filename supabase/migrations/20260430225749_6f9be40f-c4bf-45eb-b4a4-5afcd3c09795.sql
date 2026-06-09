-- Índice parcial para próximas ações pendentes (filtro JSONB metadata.kind='next_action' não 'done')
CREATE INDEX IF NOT EXISTS idx_post_sale_events_next_action
  ON public.post_sale_events (user_id, event_date ASC)
  WHERE event_type = 'opportunity'
    AND (metadata->>'kind') = 'next_action'
    AND COALESCE((metadata->>'done')::boolean, false) = false;

-- Histórico de eventos por cliente (ordenação por data)
CREATE INDEX IF NOT EXISTS idx_post_sale_events_client_date
  ON public.post_sale_events (client_id, event_date DESC, created_at DESC);

-- Lances por cliente
CREATE INDEX IF NOT EXISTS idx_post_sale_bids_client_date
  ON public.post_sale_bids (client_id, bid_date DESC);

-- Filtro por tipo de evento + tempo (pipelineMetrics)
CREATE INDEX IF NOT EXISTS idx_proposal_events_type_created
  ON public.proposal_events (event_type, created_at DESC);
