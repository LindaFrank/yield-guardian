REVOKE EXECUTE ON FUNCTION public.check_invite_code(text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.check_invite_code(text) TO service_role;