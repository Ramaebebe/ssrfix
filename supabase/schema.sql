-- tenants/entities
create schema if not exists portal;

create table if not exists portal.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  created_at timestamptz default now()
);

create table if not exists portal.profiles (
  user_id uuid primary key,
  org_id uuid references portal.orgs(id) on delete cascade,
  email text not null,
  role text not null default 'user', -- user|ops|admin
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- vehicles & accessories (for quoting)
create table if not exists portal.vehicles (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  variant text,
  fuel text,
  ev boolean default false,
  base_price numeric not null
);

create table if not exists portal.accessories (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  label text not null,
  price numeric not null
);

-- quotes
create table if not exists portal.quotes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references portal.orgs(id) on delete cascade,
  user_id uuid not null,
  vehicle_id uuid references portal.vehicles(id),
  term_months int not null,
  limit_km int not null,
  accessories uuid[] default '{}',
  monthly numeric not null,
  total numeric not null,
  pdf_path text,
  created_at timestamptz default now()
);

-- audits (simple)
create table if not exists portal.audit_inspections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references portal.orgs(id) on delete cascade,
  user_id uuid not null,
  reg text not null,
  odometer int,
  condition text,
  issues text,
  lat numeric,
  lng numeric,
  created_at timestamptz default now()
);

create table if not exists portal.audit_photos (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid references portal.audit_inspections(id) on delete cascade,
  path text not null,
  filename text,
  created_at timestamptz default now()
);

-- WCP module
create table if not exists portal.wcp_assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references portal.orgs(id) on delete cascade,
  vehicle_id uuid references portal.vehicles(id),
  operator_id uuid not null,
  signature_url text,
  created_at timestamptz default now()
);

create table if not exists portal.wcp_assessment_items (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references portal.wcp_assessments(id) on delete cascade,
  category text not null,
  field text not null,
  status text not null, -- pass|fail|na
  notes text,
  media_path text,
  created_at timestamptz default now()
);
