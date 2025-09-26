-- === PORTAL EXTENSIONS: QUOTES + AUDITS ==============================

-- Vehicles catalog (optional; used by Quoting page)
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  mm_code text,
  make text not null,
  model text not null,
  derivative text,
  capex numeric not null,
  is_ev boolean default false,
  created_at timestamptz default now()
);

-- Signed quote uploads (tracks uploaded signed PDFs)
create table if not exists public.signed_quote_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  path text not null,
  filename text not null,
  created_at timestamptz default now()
);

-- Vehicle audit inspections
create table if not exists public.audit_inspections (
  id uuid primary key default gen_random_uuid(),
  reg text not null,
  odometer numeric,
  condition text not null,
  issues text,
  lat double precision,
  lng double precision,
  created_at timestamptz default now(),
  user_email text generated always as ((auth.jwt()->>'email')) stored
);

-- Photos for each inspection
create table if not exists public.audit_photos (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.audit_inspections(id) on delete cascade,
  path text not null,
  filename text not null,
  created_at timestamptz default now()
);

-- RLS
alter table public.vehicles enable row level security;
alter table public.signed_quote_uploads enable row level security;
alter table public.audit_inspections enable row level security;
alter table public.audit_photos enable row level security;

-- Vehicles readable by all authenticated users (or open if you prefer)
do $$ begin
  if not exists (select 1 from pg_policies where polname = 'vehicles_select_all') then
    create policy "vehicles_select_all" on public.vehicles
      for select using (true);
  end if;
end $$;

-- Signed quotes: users can insert their own; admin can read (simplified: allow read all)
do $$ begin
  if not exists (select 1 from pg_policies where polname = 'signed_quotes_select_all') then
    create policy "signed_quotes_select_all" on public.signed_quote_uploads for select using (true);
  end if;
  if not exists (select 1 from pg_policies where polname = 'signed_quotes_insert_any') then
    create policy "signed_quotes_insert_any" on public.signed_quote_uploads for insert with check (true);
  end if;
end $$;

-- Audits: allow insert; allow select all (tighten later to user_email if needed)
do $$ begin
  if not exists (select 1 from pg_policies where polname = 'audit_inspections_select') then
    create policy "audit_inspections_select" on public.audit_inspections for select using (true);
  end if;
  if not exists (select 1 from pg_policies where polname = 'audit_inspections_insert') then
    create policy "audit_inspections_insert" on public.audit_inspections for insert with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where polname = 'audit_photos_select') then
    create policy "audit_photos_select" on public.audit_photos for select using (true);
  end if;
  if not exists (select 1 from pg_policies where polname = 'audit_photos_insert') then
    create policy "audit_photos_insert" on public.audit_photos for insert with check (true);
  end if;
end $$;

-- Helper: inspections with photo counts
create or replace function public.list_inspections_with_counts()
returns table (
  id uuid,
  reg text,
  odometer numeric,
  condition text,
  issues text,
  lat double precision,
  lng double precision,
  created_at timestamptz,
  photo_count bigint
) language sql stable as $$
  select i.id, i.reg, i.odometer, i.condition, i.issues, i.lat, i.lng, i.created_at,
         (select count(*) from public.audit_photos p where p.inspection_id = i.id) as photo_count
  from public.audit_inspections i
  order by i.created_at desc
$$;
