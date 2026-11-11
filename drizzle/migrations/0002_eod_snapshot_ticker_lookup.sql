CREATE OR REPLACE FUNCTION public.fmp_eod_prices_for(p_date date, p_tickers text[])
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  snap_date date;
  all_prices jsonb;
  result jsonb := '{}'::jsonb;
  t text;
BEGIN
  SELECT market_date INTO snap_date FROM public.fmp_eod_snapshot WHERE id = 'commercial';
  IF snap_date IS DISTINCT FROM p_date THEN
    RETURN NULL; -- snapshot missing or for another date
  END IF;
  SELECT prices INTO all_prices FROM public.fmp_eod_snapshot WHERE id = 'commercial';
  IF all_prices IS NULL THEN
    RETURN NULL;
  END IF;
  FOREACH t IN ARRAY coalesce(p_tickers, ARRAY[]::text[]) LOOP
    IF all_prices ? t THEN
      result := result || jsonb_build_object(t, all_prices -> t);
    END IF;
  END LOOP;
  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.fmp_eod_prices_for(date, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fmp_eod_prices_for(date, text[]) TO service_role;