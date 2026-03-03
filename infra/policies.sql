ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE force_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_positions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON events FROM anon, authenticated;
REVOKE ALL ON force_positions FROM anon, authenticated;
REVOKE ALL ON assets FROM anon, authenticated;
REVOKE ALL ON asset_positions FROM anon, authenticated;

GRANT SELECT ON public_events_delayed TO anon;
GRANT SELECT ON public_force_positions_delayed TO anon;
GRANT SELECT ON public_asset_positions_delayed TO anon;

CREATE POLICY events_deny_write_anon ON events
FOR ALL TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY force_positions_deny_write_anon ON force_positions
FOR ALL TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY assets_deny_write_anon ON assets
FOR ALL TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY asset_positions_deny_write_anon ON asset_positions
FOR ALL TO anon
USING (false)
WITH CHECK (false);
