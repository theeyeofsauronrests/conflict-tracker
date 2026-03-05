-- Local Postgres privilege model (no Supabase roles required).
-- Public readers can only query delayed views, never source tables.

REVOKE ALL ON TABLE events FROM PUBLIC;
REVOKE ALL ON TABLE force_positions FROM PUBLIC;
REVOKE ALL ON TABLE assets FROM PUBLIC;
REVOKE ALL ON TABLE asset_positions FROM PUBLIC;

REVOKE ALL ON TABLE public_events_delayed FROM PUBLIC;
REVOKE ALL ON TABLE public_force_positions_delayed FROM PUBLIC;
REVOKE ALL ON TABLE public_asset_positions_delayed FROM PUBLIC;

GRANT SELECT ON TABLE public_events_delayed TO PUBLIC;
GRANT SELECT ON TABLE public_force_positions_delayed TO PUBLIC;
GRANT SELECT ON TABLE public_asset_positions_delayed TO PUBLIC;
