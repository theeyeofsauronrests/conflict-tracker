import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

interface SeedEvent {
  eventType: "strike" | "intercept";
  eventTime: string;
  confidence: number;
  rawText: string;
  dedupeKey: string;
  lon: number;
  lat: number;
  radiusM: number;
  actorNationality?: string;
  targetNationality?: string;
  sources: unknown[];
}

interface SeedForce {
  forceId: string;
  nationality: string;
  unitType: string;
  observedTime: string;
  confidence: number;
  lon: number;
  lat: number;
  sources: unknown[];
}

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, "..");
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST ?? "localhost",
    port: Number(process.env.PGPORT ?? "54322"),
    database: process.env.PGDATABASE ?? "conflict_tracker",
    user: process.env.PGUSER ?? "postgres",
    password: process.env.PGPASSWORD ?? "postgres"
  });
  const seedDir = path.join(repoRoot, "infra/seed");

  const events = JSON.parse(await readFile(path.join(seedDir, "events.seed.json"), "utf8")) as SeedEvent[];
  const forces = JSON.parse(await readFile(path.join(seedDir, "forces.seed.json"), "utf8")) as SeedForce[];

  const eventRows = events.map((event) => ({
    event_time: event.eventTime,
    ingested_at: new Date().toISOString(),
    confidence: event.confidence,
    event_type: event.eventType,
    actor_nationality: event.actorNationality ?? null,
    target_nationality: event.targetNationality ?? null,
    blast_radius_m: event.radiusM,
    raw_text: event.rawText,
    dedupe_key: event.dedupeKey,
    sources: event.sources,
    lon: event.lon,
    lat: event.lat
  }));

  const forceRows = forces.map((force) => ({
    force_id: force.forceId,
    nationality: force.nationality,
    unit_type: force.unitType,
    observed_time: force.observedTime,
    confidence: force.confidence,
    sources: force.sources,
    lon: force.lon,
    lat: force.lat
  }));

  const eventQuery = `
    INSERT INTO events (
      event_time,
      ingested_at,
      confidence,
      event_type,
      actor_nationality,
      target_nationality,
      blast_radius_m,
      raw_text,
      dedupe_key,
      sources,
      geometry
    ) VALUES (
      $1::timestamptz,
      now(),
      $2::double precision,
      $3::text,
      $4::text,
      $5::text,
      $6::integer,
      $7::text,
      $8::text,
      $9::jsonb,
      ST_SetSRID(ST_MakePoint($10::double precision, $11::double precision), 4326)
    )
    ON CONFLICT (dedupe_key) DO UPDATE SET
      confidence = EXCLUDED.confidence,
      actor_nationality = EXCLUDED.actor_nationality,
      target_nationality = EXCLUDED.target_nationality,
      blast_radius_m = EXCLUDED.blast_radius_m,
      raw_text = EXCLUDED.raw_text,
      sources = EXCLUDED.sources`;

  const forceQuery = `
    INSERT INTO force_positions (
      force_id,
      nationality,
      unit_type,
      observed_time,
      confidence,
      sources,
      geometry
    ) VALUES (
      $1::text,
      $2::text,
      $3::text,
      $4::timestamptz,
      $5::double precision,
      $6::jsonb,
      ST_SetSRID(ST_MakePoint($7::double precision, $8::double precision), 4326)
    )`;

  for (const event of eventRows) {
    await pool.query(eventQuery, [
      event.event_time,
      event.confidence,
      event.event_type,
      event.actor_nationality,
      event.target_nationality,
      event.blast_radius_m,
      event.raw_text,
      event.dedupe_key,
      JSON.stringify(event.sources),
      event.lon,
      event.lat
    ]);
  }

  for (const force of forceRows) {
    await pool.query(forceQuery, [
      force.force_id,
      force.nationality,
      force.unit_type,
      force.observed_time,
      force.confidence,
      JSON.stringify(force.sources),
      force.lon,
      force.lat
    ]);
  }

  await pool.end();

  console.log(`Seeded ${eventRows.length} events and ${forceRows.length} force positions`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
