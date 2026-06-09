ALTER TABLE public.post_sale_clients
  ADD COLUMN IF NOT EXISTS patrimony_strategy text,
  ADD COLUMN IF NOT EXISTS bid_capacity_value numeric(12,2),
  ADD COLUMN IF NOT EXISTS bid_capacity_percent numeric(5,2);