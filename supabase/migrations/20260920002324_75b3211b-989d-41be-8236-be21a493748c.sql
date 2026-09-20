CREATE OR REPLACE FUNCTION public.check_invite_code(_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.beta_invite_codes
    WHERE code = _code
      AND revoked = false
      AND (expires_at IS NULL OR expires_at > now())
      AND uses < max_uses
  );
$$;