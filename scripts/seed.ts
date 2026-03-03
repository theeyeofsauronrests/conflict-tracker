import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

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
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const seedDir = path.resolve(process.cwd(), "infra/seed");

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
    geometry: `POINT(${event.lon} ${event.lat})`
  }));

  const forceRows = forces.map((force) => ({
    force_id: force.forceId,
    nationality: force.nationality,
    unit_type: force.unitType,
    observed_time: force.observedTime,
    confidence: force.confidence,
    sources: force.sources,
    geometry: `POINT(${force.lon} ${force.lat})`
  }));

  const [eventResult, forceResult] = await Promise.all([
    supabase.from("events").upsert(eventRows, { onConflict: "dedupe_key" }),
    supabase.from("force_positions").insert(forceRows)
  ]);

  if (eventResult.error) throw eventResult.error;
  if (forceResult.error) throw forceResult.error;

  console.log(`Seeded ${eventRows.length} events and ${forceRows.length} force positions`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
