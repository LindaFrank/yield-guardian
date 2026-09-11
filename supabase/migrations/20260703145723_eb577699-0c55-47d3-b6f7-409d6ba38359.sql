
-- 1. app_settings table (singleton, id=1)
CREATE TABLE public.app_settings (
  id integer PRIMARY KEY DEFAULT 1,
  require_invite_code boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read app settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update app settings" ON public.app_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert app settings" ON public.app_settings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
INSERT INTO public.app_settings (id, require_invite_code) VALUES (1, false);

-- 2. beta_invite_codes table
CREATE TABLE public.beta_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  max_uses integer NOT NULL DEFAULT 1,
  uses integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  revoked boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.beta_invite_codes TO authenticated;
GRANT ALL ON public.beta_invite_codes TO service_role;
ALTER TABLE public.beta_invite_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view invite codes" ON public.beta_invite_codes FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_beta_invite_codes_updated_at
  BEFORE UPDATE ON public.beta_invite_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Fix admin allowlist emails
CREATE OR REPLACE FUNCTION public.grant_admin_if_allowlisted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  allowed_emails text[] := array[
    'lindafrank@aol.com',
    'mindibriese@gmail.com',
    'lfx2040@gmail.com',
    'arankin920@gmail.com'
  ];
begin
  if new.email is not null
     and lower(new.email) = any (select lower(e) from unnest(allowed_emails) as e) then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$function$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_grant_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_admin_if_allowlisted();

DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_admin ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_grant_admin
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (old.email_confirmed_at IS NULL AND new.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.grant_admin_if_allowlisted();

-- Back-fill: promote any existing users matching the allowlist
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE lower(u.email) IN ('lindafrank@aol.com','mindibriese@gmail.com','lfx2040@gmail.com','arankin920@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Atomic invite-code validator (called from Edge Function via service role)
CREATE OR REPLACE FUNCTION public.consume_invite_code(_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated int;
BEGIN
  UPDATE public.beta_invite_codes
  SET uses = uses + 1
  WHERE code = _code
    AND revoked = false
    AND (expires_at IS NULL OR expires_at > now())
    AND uses < max_uses;
  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated > 0;
END;
$$;
