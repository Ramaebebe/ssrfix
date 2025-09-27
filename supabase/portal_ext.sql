create schema if not exists portal;
create table if not exists portal.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists portal.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references portal.orgs(id) on delete restrict,
  full_name text,
  role text check (role in ('admin','manager','agent','viewer')) default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists portal.rebills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references portal.orgs(id) on delete restrict,
  client_name text not null,
  status text not null check (status in ('awaiting authorization','approved','rejected','written_off')),
  amount numeric(14,2) not null default 0,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create or replace function portal.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'profiles_set_updated_at') then
    create trigger profiles_set_updated_at before update on portal.profiles
    for each row execute function portal.set_updated_at();
  end if;
end $$;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'orgs_set_updated_at') then
    create trigger orgs_set_updated_at before update on portal.orgs
    for each row execute function portal.set_updated_at();
  end if;
end $$;
create or replace function portal.assert_same_org(target_org uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from portal.profiles p
    where p.user_id = auth.uid()
      and p.org_id = target_org
      and p.is_active = true
  );
$$;
