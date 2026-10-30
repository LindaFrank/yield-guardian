-- Every saved price must be tagged with the FMP plan that fetched it, so a
-- price fetched under Linda's personal plan is never shown to other people.
-- Existing rows were all fetched with the personal key, so they stay 'personal'.
ALTER TABLE public.stock_cache
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'personal';

ALTER TABLE public.stock_cache DROP CONSTRAINT IF EXISTS stock_cache_pkey;
ALTER TABLE public.stock_cache
  ADD CONSTRAINT stock_cache_pkey PRIMARY KEY (ticker, source);

GRANT ALL ON public.stock_cache TO service_role;
GRANT SELECT ON public.stock_cache TO anon, authenticated;