CREATE TABLE public.fmp_eod_snapshot (
  id text PRIMARY KEY DEFAULT 'commercial',
  market_date date,
  prices jsonb NOT NULL DEFAULT '{}'::jsonb,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.fmp_eod_snapshot TO service_role;
REVOKE ALL ON public.fmp_eod_snapshot FROM anon, authenticated;
ALTER TABLE public.fmp_eod_snapshot ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.fmp_eod_snapshot IS 'Private Enterprise-only bulk closing prices and shared provider retry lease; no client access.';
CREATE FUNCTION public.claim_fmp_eod_download() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE claimed text;
BEGIN
  INSERT INTO public.fmp_eod_snapshot (id, next_attempt_at)
  VALUES ('commercial', now() + interval '4 hours')
  ON CONFLICT (id) DO UPDATE SET next_attempt_at = now() + interval '4 hours'
  WHERE fmp_eod_snapshot.next_attempt_at <= now()
  RETURNING id INTO claimed;
  RETURN claimed IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_fmp_eod_download() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_fmp_eod_download() TO service_role;