insert into portal.orgs (id, name, domain)
values ('00000000-0000-0000-0000-000000000001','Afrirent','afrirent.co.za')
on conflict (id) do nothing;

-- sample vehicles
insert into portal.vehicles (make, model, variant, fuel, ev, base_price) values
('Toyota','Hilux','2.8 GD-6 4x4','diesel',false, 650000),
('Ford','Ranger','2.0 Bi-Turbo XLT','diesel',false, 620000),
('BYD','Seal','Long Range','electric',true, 780000)
on conflict do nothing;

-- accessories
insert into portal.accessories (code,label,price) values
('TOW','Towbar', 9500),
('CNP','Canopy', 18500),
('SAG','Smash & Grab', 3200)
on conflict do nothing;
