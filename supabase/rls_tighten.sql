alter table portal.orgs enable row level security;
alter table portal.profiles enable row level security;
alter table portal.quotes enable row level security;
alter table portal.audit_inspections enable row level security;
alter table portal.audit_photos enable row level security;
alter table portal.wcp_assessments enable row level security;
alter table portal.wcp_assessment_items enable row level security;

-- helper: same org
create or replace function portal.assert_same_org(check_org uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from portal.profiles p
     where p.user_id = auth.uid() and p.org_id = check_org and p.is_active
  );
$$;

-- orgs: readable if you belong
create policy orgs_select on portal.orgs
for select using (
  exists (select 1 from portal.profiles p where p.user_id = auth.uid() and p.org_id = orgs.id and p.is_active)
);
create policy orgs_insert on portal.orgs for insert with check (false);
create policy orgs_update on portal.orgs for update using (false) with check (false);

-- profiles: same org
create policy profiles_select on portal.profiles for select using (portal.assert_same_org(org_id));
create policy profiles_insert on portal.profiles for insert with check(false);
create policy profiles_update on portal.profiles
for update using (
  portal.assert_same_org(org_id) and (
    user_id = auth.uid() or exists(select 1 from portal.profiles x where x.user_id = auth.uid() and x.org_id = profiles.org_id and x.role='admin' and x.is_active)
  )
);

-- quotes: same org
create policy quotes_rw on portal.quotes
for all using (portal.assert_same_org(org_id)) with check (portal.assert_same_org(org_id));

-- audits
create policy audits_rw on portal.audit_inspections
for all using (portal.assert_same_org(org_id)) with check (portal.assert_same_org(org_id));
create policy audit_photos_rw on portal.audit_photos
for all using (
  exists (select 1 from portal.audit_inspections i where i.id=inspection_id and portal.assert_same_org(i.org_id))
) with check (
  exists (select 1 from portal.audit_inspections i where i.id=inspection_id and portal.assert_same_org(i.org_id))
);

-- wcp
create policy wcp_assessments_rw on portal.wcp_assessments
for all using (portal.assert_same_org(org_id)) with check (portal.assert_same_org(org_id));
create policy wcp_items_rw on portal.wcp_assessment_items
for all using (
  exists (select 1 from portal.wcp_assessments a where a.id=assessment_id and portal.assert_same_org(a.org_id))
) with check (
  exists (select 1 from portal.wcp_assessments a where a.id=assessment_id and portal.assert_same_org(a.org_id))
);
