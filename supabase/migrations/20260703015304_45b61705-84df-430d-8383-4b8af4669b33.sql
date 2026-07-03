
-- 1. Role enum
create type public.app_role as enum ('admin', 'user');

-- 2. user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

-- 3. has_role security definer
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- 4. Policies
create policy "Users can view own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can view all roles"
on public.user_roles for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert roles"
on public.user_roles for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete roles"
on public.user_roles for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- 5. Admin allowlist + auto-grant trigger
create or replace function public.grant_admin_if_allowlisted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_emails text[] := array[
    'lindafrank@aol.com',
    'mindibriese@gmail.com',
    'shelli@example.com',
    'anna@example.com'
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
$$;

create trigger on_auth_user_created_grant_admin
after insert on auth.users
for each row execute function public.grant_admin_if_allowlisted();

-- 6. Backfill: grant admin to any allowlisted user that already exists,
--    and grant 'user' role to everyone else so the app has a role for each account.
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
where lower(u.email) in (
  'lindafrank@aol.com','mindibriese@gmail.com','shelli@example.com','anna@example.com'
)
on conflict do nothing;

insert into public.user_roles (user_id, role)
select u.id, 'user'::public.app_role
from auth.users u
where not exists (
  select 1 from public.user_roles r where r.user_id = u.id
)
on conflict do nothing;
