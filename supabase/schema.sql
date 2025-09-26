-- tenants & users
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table app_users (
  id uuid primary key default auth.uid(),
  email text not null unique,
  tenant_id uuid not null references tenants(id),
  role text not null default 'client_user' check (role in ('admin','ops','client_user'))
);

-- vehicles
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  reg text not null,
  mm_code text,
  make text, model text, derivative text,
  unique(tenant_id, reg)
);

-- quotes
create table quotes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  created_by uuid not null references app_users(id),
  customer_name text,
  customer_email text,
  cost_center text,
  vehicle_reg text,
  vehicle_mmcode text,
  term_months int not null,
  km_total int,
  residual_pct numeric,
  apr_pct numeric,
  monthly_payment numeric,
  total_cost numeric,
  status text not null default 'draft'
);

create table quote_files (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  kind text not null check (kind in ('generated_pdf','signed_acceptance')),
  storage_path text not null
);

-- audits
create table vehicle_audits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  vehicle_id uuid not null references vehicles(id),
  inspected_at timestamptz not null default now(),
  inspected_by uuid not null references app_users(id),
  lat double precision, lng double precision,
  condition_score int check (condition_score between 0 and 100),
  notes text
);

create table vehicle_audit_photos (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references vehicle_audits(id) on delete cascade,
  storage_path text not null
);
