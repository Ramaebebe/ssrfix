-- Tighten RLS to auth.uid() and domain-based access for selected tables
-- Assumes auth schema present and JWT contains 'sub' and 'email'

-- Example: vehicles visible to same tenant by email domain (optional)
create or replace function public.email_domain() returns text
language sql stable as $$
  select split_part(coalesce(current_setting('request.jwt.claims', true)::json->>'email',''), '@', 2);
$$;

-- Ensure RLS is enabled
alter table if exists vehicles enable row level security;
alter table if exists signed_quote_uploads enable row level security;
alter table if exists audit_inspections enable row level security;
alter table if exists audit_photos enable row level security;

-- Drop existing permissive policies (adjust names as needed)
do $$ begin
  drop policy if exists "User access by email" on vehicles;
exception when others then null; end $$;

-- Vehicles: allow select if same email domain OR created_by matches auth.uid()
do $$ begin
  alter table vehicles add column if not exists created_by uuid;
exception when others then null; end $$;

create policy "vehicles_select_same_domain_or_owner" on vehicles
  for select using (
    (created_by = auth.uid()) or
    (email_domain() is not null and split_part(coalesce(vehicles.owner_email,''), '@', 2) = email_domain())
  );

-- Inspections: only owner
do $$ begin
  alter table audit_inspections add column if not exists created_by uuid;
exception when others then null; end $$;

create policy "inspections_owner_rw" on audit_inspections
  for all using (created_by = auth.uid()) with check (created_by = auth.uid());

-- Photos: only owner; path stored per object
do $$ begin
  alter table audit_photos add column if not exists created_by uuid;
exception when others then null; end $$;

create policy "photos_owner_rw" on audit_photos
  for all using (created_by = auth.uid()) with check (created_by = auth.uid());

-- Signed quotes: only owner
do $$ begin
  alter table signed_quote_uploads add column if not exists created_by uuid;
exception when others then null; end $$;

create policy "signed_quotes_owner_rw" on signed_quote_uploads
  for all using (created_by = auth.uid()) with check (created_by = auth.uid());

-- Storage policies: restrict buckets to owner-only; signed URLs used for reads
-- NOTE: run once per bucket
-- Replace 'audit-photos' and 'signed-quotes' with your bucket names if different
create policy "storage_audit_photos_insert_owner"
  on storage.objects for insert
  with check (
    bucket_id = 'audit-photos' and (auth.uid() = owner)
  );

create policy "storage_audit_photos_owner_read"
  on storage.objects for select
  using (bucket_id = 'audit-photos' and (auth.uid() = owner));

create policy "storage_signed_quotes_insert_owner"
  on storage.objects for insert
  with check (
    bucket_id = 'signed-quotes' and (auth.uid() = owner)
  );

create policy "storage_signed_quotes_owner_read"
  on storage.objects for select
  using (bucket_id = 'signed-quotes' and (auth.uid() = owner));

-- Helpers to set created_by automatically
create or replace function public.set_created_by()
returns trigger language plpgsql as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end $$;

drop trigger if exists set_created_by_vehicles on vehicles;
create trigger set_created_by_vehicles before insert on vehicles
for each row execute function public.set_created_by();

drop trigger if exists set_created_by_inspections on audit_inspections;
create trigger set_created_by_inspections before insert on audit_inspections
for each row execute function public.set_created_by();

drop trigger if exists set_created_by_photos on audit_photos;
create trigger set_created_by_photos before insert on audit_photos
for each row execute function public.set_created_by();

drop trigger if exists set_created_by_signed on signed_quote_uploads;
create trigger set_created_by_signed before insert on signed_quote_uploads
for each row execute function public.set_created_by();