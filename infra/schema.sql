CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_time TIMESTAMPTZ NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  visible_at TIMESTAMPTZ NOT NULL,
  confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  event_type TEXT NOT NULL CHECK (event_type IN ('strike', 'intercept')),
  actor_nationality TEXT,
  target_nationality TEXT,
  target_type TEXT,
  blast_radius_m INTEGER,
  raw_text TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  geometry GEOMETRY(Point, 4326) NOT NULL
);

CREATE OR REPLACE FUNCTION set_event_visible_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Keep delay enforcement derived from event_time on every write.
  NEW.visible_at := NEW.event_time + interval '6 hours';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_events_visible_at ON events;
CREATE TRIGGER trg_events_visible_at
BEFORE INSERT OR UPDATE OF event_time ON events
FOR EACH ROW
EXECUTE FUNCTION set_event_visible_at();

CREATE INDEX IF NOT EXISTS idx_events_geom ON events USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_events_event_time ON events (event_time DESC);

CREATE TABLE IF NOT EXISTS force_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  force_id TEXT NOT NULL,
  nationality TEXT NOT NULL,
  unit_type TEXT NOT NULL,
  observed_time TIMESTAMPTZ NOT NULL,
  confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  geometry GEOMETRY(Point, 4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_force_positions_geom ON force_positions USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_force_positions_time ON force_positions (observed_time DESC);

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  nationality TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS asset_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  observed_time TIMESTAMPTZ NOT NULL,
  confidence DOUBLE PRECISION NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  geometry GEOMETRY(Point, 4326) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_positions_geom ON asset_positions USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_asset_positions_time ON asset_positions (observed_time DESC);

CREATE OR REPLACE VIEW public_events_delayed AS
SELECT
  id,
  event_time,
  visible_at,
  confidence,
  event_type,
  actor_nationality,
  target_nationality,
  blast_radius_m AS radius_m,
  raw_text,
  dedupe_key,
  sources,
  ST_X(geometry)::DOUBLE PRECISION AS lon,
  ST_Y(geometry)::DOUBLE PRECISION AS lat
FROM events
WHERE visible_at <= now();

CREATE OR REPLACE VIEW public_force_positions_delayed AS
SELECT
  id,
  force_id,
  nationality,
  unit_type,
  observed_time,
  confidence,
  sources,
  ST_X(geometry)::DOUBLE PRECISION AS lon,
  ST_Y(geometry)::DOUBLE PRECISION AS lat
FROM force_positions
WHERE observed_time <= now() - interval '6 hours';

CREATE OR REPLACE VIEW public_asset_positions_delayed AS
SELECT
  ap.id,
  ap.asset_id,
  a.label,
  a.nationality,
  a.asset_type,
  ap.observed_time,
  ap.confidence,
  ap.sources,
  ST_X(ap.geometry)::DOUBLE PRECISION AS lon,
  ST_Y(ap.geometry)::DOUBLE PRECISION AS lat
FROM asset_positions ap
JOIN assets a ON a.id = ap.asset_id
WHERE ap.observed_time <= now() - interval '6 hours';
