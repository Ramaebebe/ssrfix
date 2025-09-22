-- Basic schema for fleet data with RLS
CREATE TABLE IF NOT EXISTS fleet_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reg TEXT NOT NULL,
  entity TEXT NOT NULL,
  status TEXT NOT NULL,
  avail NUMERIC,
  downtime TEXT,
  util NUMERIC,
  user_email TEXT NOT NULL
);
ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User access by email" ON fleet_vehicles FOR SELECT USING (auth.jwt() ->> 'email' = user_email);
