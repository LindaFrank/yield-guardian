ALTER TABLE public.stock_cache
  ADD COLUMN IF NOT EXISTS history_data jsonb,
  ADD COLUMN IF NOT EXISTS history_cached_at timestamptz;