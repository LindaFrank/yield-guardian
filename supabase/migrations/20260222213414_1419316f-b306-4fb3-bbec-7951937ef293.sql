
-- 1. User stock selections (portfolio persistence)
CREATE TABLE public.user_stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticker TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, ticker)
);

ALTER TABLE public.user_stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stocks" ON public.user_stocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add own stocks" ON public.user_stocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stocks" ON public.user_stocks
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Server-side stock data cache (shared across all users)
CREATE TABLE public.stock_cache (
  ticker TEXT NOT NULL PRIMARY KEY,
  quote_data JSONB,
  dividends_data JSONB,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_cache ENABLE ROW LEVEL SECURITY;

-- Everyone can read cache (it's public market data)
CREATE POLICY "Anyone can read stock cache" ON public.stock_cache
  FOR SELECT USING (true);

-- Only service role (edge functions) writes cache, so no INSERT/UPDATE/DELETE policies for anon
