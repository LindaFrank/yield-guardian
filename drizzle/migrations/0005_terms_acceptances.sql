CREATE TABLE public.terms_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  terms_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, terms_version)
);

GRANT SELECT ON public.terms_acceptances TO authenticated;
GRANT ALL ON public.terms_acceptances TO service_role;

ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own terms acceptances"
ON public.terms_acceptances FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all terms acceptances"
ON public.terms_acceptances FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.accept_terms(p_version text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_at timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;
  IF p_version IS NULL OR p_version !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
    RAISE EXCEPTION 'Invalid terms version';
  END IF;
  INSERT INTO public.terms_acceptances (user_id, terms_version)
  VALUES (v_uid, p_version)
  ON CONFLICT (user_id, terms_version) DO NOTHING;
  SELECT accepted_at INTO v_at FROM public.terms_acceptances
  WHERE user_id = v_uid AND terms_version = p_version;
  RETURN v_at;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_terms(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.accept_terms(text) TO authenticated;