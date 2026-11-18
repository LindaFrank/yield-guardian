create table public.free_trials (
  user_id uuid primary key,
  started_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

grant select on public.free_trials to authenticated;
grant all on public.free_trials to service_role;

alter table public.free_trials enable row level security;

create policy "Users can view own free trial"
  on public.free_trials for select to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all free trials"
  on public.free_trials for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Starts the caller's card-free month once. _started_at lets a guest's free month
-- (begun before signing up) carry over; it can only shorten the month, never extend it.
create or replace function public.start_free_trial(_started_at timestamptz default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _now timestamptz := now();
  _cutoff constant timestamptz := '2027-02-01 00:00:00-08';
  _start timestamptz;
  _row public.free_trials;
begin
  if _uid is null then
    raise exception 'Not signed in';
  end if;

  select * into _row from public.free_trials where user_id = _uid;
  if found then
    return to_jsonb(_row);
  end if;

  _start := least(_now, greatest(coalesce(_started_at, _now), _now - interval '30 days'));
  if _start >= _cutoff then
    return null;
  end if;

  insert into public.free_trials (user_id, started_at, ends_at)
  values (_uid, _start, _start + interval '30 days')
  on conflict (user_id) do nothing;

  select * into _row from public.free_trials where user_id = _uid;
  return to_jsonb(_row);
end;
$$;

revoke execute on function public.start_free_trial(timestamptz) from public, anon;
grant execute on function public.start_free_trial(timestamptz) to authenticated;