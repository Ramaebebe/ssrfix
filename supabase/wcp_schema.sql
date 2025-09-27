-- Enable RLS
alter table if exists vehicles enable row level security;

create table if not exists wcp_assessments (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id),
  operator_id uuid references auth.users(id),
  created_at timestamptz default now(),
  location text,
  signature_url text
);

create table if not exists wcp_assessment_items (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references wcp_assessments(id),
  category text,
  item text,
  status text check (status in ('Pass','Fail')),
  notes text,
  media_url text
);

create table if not exists wcp_work_orders (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references wcp_assessments(id),
  item_id uuid references wcp_assessment_items(id),
  status text default 'Open',
  priority text default 'Normal',
  created_at timestamptz default now()
);

-- Auto-generate work orders for failed checks
create or replace function wcp_generate_work_orders()
returns trigger as $$
begin
  if new.status = 'Fail' then
    insert into wcp_work_orders (assessment_id, item_id, priority)
    values (new.assessment_id, new.id, 'High');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_wcp_items_fail
after insert on wcp_assessment_items
for each row execute function wcp_generate_work_orders();
