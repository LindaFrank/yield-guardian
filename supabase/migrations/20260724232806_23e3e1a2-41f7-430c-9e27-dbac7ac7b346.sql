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
    'arankin920@gmail.com',
    'mindi@yieldguardian.com',
    'linda@yieldguardian.com',
    'shelly@yieldguardian.com',
    'anna@yieldguardian.com'
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