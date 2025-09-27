alter table portal.orgs enable row level security;
alter table portal.profiles enable row level security;
alter table portal.rebills enable row level security;

drop policy if exists orgs_select on portal.orgs;
create policy orgs_select on portal.orgs
  for select using (
    exists (
      select 1 from portal.profiles p
      where p.user_id = auth.uid()
        and p.org_id = orgs.id
        and p.is_active = true
    )
  );

drop policy if exists orgs_insert on portal.orgs;
create policy orgs_insert on portal.orgs
  for insert with check (false);

drop policy if exists orgs_update on portal.orgs;
create policy orgs_update on portal.orgs
  for update using (false) with check (false);

drop policy if exists profiles_select on portal.profiles;
create policy profiles_select on portal.profiles
  for select using (portal.assert_same_org(org_id));

drop policy if exists profiles_insert on portal.profiles;
create policy profiles_insert on portal.profiles
  for insert with check (false);

drop policy if exists profiles_update on portal.profiles;
create policy profiles_update on portal.profiles
  for update using (
    portal.assert_same_org(org_id) and (
      user_id = auth.uid() or
      exists (
        select 1 from portal.profiles p
        where p.user_id = auth.uid()
          and p.org_id = profiles.org_id
          and p.role = 'admin'
          and p.is_active = true
      )
    )
  );

drop policy if exists rebills_select on portal.rebills;
create policy rebills_select on portal.rebills
  for select using (portal.assert_same_org(org_id));

drop policy if exists rebills_insert on portal.rebills;
create policy rebills_insert on portal.rebills
  for insert with check (portal.assert_same_org(org_id));

drop policy if exists rebills_update on portal.rebills;
create policy rebills_update on portal.rebills
  for update using (portal.assert_same_org(org_id));
