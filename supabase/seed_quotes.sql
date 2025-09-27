-- Example seed for one demo entity + a few vehicles & accessories
-- Safe to re-run: uses ON CONFLICT where relevant.

-- 1) Ensure entity exists
insert into public.entities (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Afrirent Demo')
on conflict (id) do nothing;

-- 2) A demo profile for testing (maps to your Auth user UUID)
-- Replace the UUID below with your own auth.users.id when testing locally.
insert into public.profiles (user_id, default_entity)
values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001')
on conflict (user_id) do update set default_entity = excluded.default_entity;

insert into public.users_entities (user_id, entity_id, role)
values ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'admin')
on conflict (user_id, entity_id) do update set role = excluded.role;

-- 3) Vehicles (simple pricing params)
insert into public.vehicles (entity_id, code, base_price, residual_rate, rate)
values
('00000000-0000-0000-0000-000000000001','HILUX_2.4D', 520000, 0.20, 0.12),
('00000000-0000-0000-0000-000000000001','RANGER_2.0D', 560000, 0.22, 0.12),
('00000000-0000-0000-0000-000000000001','NP200_1.6',  240000, 0.15, 0.10)
on conflict (code) do update set
  base_price = excluded.base_price,
  residual_rate = excluded.residual_rate,
  rate = excluded.rate;

-- 4) Accessories
insert into public.accessories (entity_id, code, price)
values
('00000000-0000-0000-0000-000000000001','TOWBAR',      9500),
('00000000-0000-0000-0000-000000000001','CANOPY',     18500),
('00000000-0000-0000-0000-000000000001','SMASHGRAB',   4500),
('00000000-0000-0000-0000-000000000001','TRACKER',     8500)
on conflict (entity_id, code) do update set price = excluded.price;

-- 5) Create the 'quotes' storage bucket if it doesn't exist yet
-- (Run in the SQL editor once; ignore if already created.)
-- Note: Requires service role / dashboard privileges.
select
  case when exists(
    select 1 from storage.buckets where name = 'quotes'
  ) then 'exists'
  else (
    select storage.create_bucket('quotes', public => false)
  ) end as quotes_bucket;
