CREATE TABLE public.fmp_eod_prices (
  market_date date NOT NULL,
  symbol text NOT NULL,
  close numeric NOT NULL,
  open numeric,
  high numeric,
  low numeric,
  volume numeric,
  PRIMARY KEY (market_date, symbol)
);
GRANT ALL ON public.fmp_eod_prices TO service_role;
REVOKE ALL ON public.fmp_eod_prices FROM anon, authenticated;
ALTER TABLE public.fmp_eod_prices ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.fmp_eod_prices IS 'Private Enterprise-only closing prices, one row per symbol per completed session; visible only once fmp_eod_snapshot.market_date marks the date complete.';

INSERT INTO public.fmp_eod_prices (market_date, symbol, close, open, high, low, volume)
SELECT s.market_date, e.key,
  (e.value->>'close')::numeric,
  (e.value->>'open')::numeric,
  (e.value->>'high')::numeric,
  (e.value->>'low')::numeric,
  (e.value->>'volume')::numeric
FROM public.fmp_eod_snapshot s, jsonb_each(s.prices) e
WHERE s.id = 'commercial' AND s.market_date IS NOT NULL
  AND jsonb_typeof(e.value->'close') = 'number'
ON CONFLICT DO NOTHING;

COMMENT ON COLUMN public.fmp_eod_snapshot.prices IS 'DEPRECATED: replaced by public.fmp_eod_prices rows; market_date on this row now only marks which session is complete.';

CREATE OR REPLACE FUNCTION public.fmp_eod_prices_for(p_date date, p_tickers text[])
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN (SELECT market_date FROM public.fmp_eod_snapshot WHERE id = 'commercial') IS DISTINCT FROM p_date THEN NULL
    ELSE coalesce((
      SELECT jsonb_object_agg(p.symbol, jsonb_strip_nulls(jsonb_build_object(
        'symbol', p.symbol, 'date', to_char(p.market_date, 'YYYY-MM-DD'), 'close', p.close,
        'open', p.open, 'high', p.high, 'low', p.low, 'volume', p.volume)))
      FROM public.fmp_eod_prices p
      WHERE p.market_date = p_date AND p.symbol = ANY(coalesce(p_tickers, ARRAY[]::text[]))
    ), '{}'::jsonb)
  END
$function$;
REVOKE ALL ON FUNCTION public.fmp_eod_prices_for(date, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fmp_eod_prices_for(date, text[]) TO service_role;