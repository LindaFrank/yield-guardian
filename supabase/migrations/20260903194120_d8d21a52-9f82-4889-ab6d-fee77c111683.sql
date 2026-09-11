ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS payments_enabled boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.get_payments_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT payments_enabled FROM public.app_settings WHERE id = 1), false);
$$;

REVOKE ALL ON FUNCTION public.get_payments_enabled() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_payments_enabled() TO anon, authenticated;
