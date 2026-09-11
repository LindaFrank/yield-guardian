
-- 1. app_settings: restrict SELECT to admins, expose gate flag via RPC
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
CREATE POLICY "Admins can read app settings" ON public.app_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_require_invite_code()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT require_invite_code FROM public.app_settings WHERE id = 1), false);
$$;

REVOKE ALL ON FUNCTION public.get_require_invite_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_require_invite_code() TO anon, authenticated;

-- 2. stock_cache: remove public read (edge functions use service_role, bypass RLS)
DROP POLICY IF EXISTS "Anyone can read stock cache" ON public.stock_cache;

-- 3. Revoke EXECUTE on SECURITY DEFINER helpers from anon/authenticated.
--    has_role must remain executable to authenticated because RLS policies invoke it
--    as the calling user. Revoke it from anon.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;

REVOKE EXECUTE ON FUNCTION public.get_admin_metrics() FROM anon, public;
-- get_admin_metrics self-checks has_role(admin); safe for authenticated

REVOKE EXECUTE ON FUNCTION public.consume_invite_code(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.grant_admin_if_allowlisted() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
