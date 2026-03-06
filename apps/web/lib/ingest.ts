import { createDefaultStages, runAgentPipeline } from "@conflict-tracker/agent-pipeline";
import { createIranConflictRssPlugin, runIngestPlugins, type IngestPlugin } from "@conflict-tracker/ingest-plugins";
import { PluginRegistry } from "@conflict-tracker/plugin-registry";
import { getDbPool } from "./db";

export async function runIngestion(): Promise<number> {
  // Registry keeps ingest sources pluggable and easy to extend later.
  const registry = new PluginRegistry<IngestPlugin>();
  registry.register(createIranConflictRssPlugin({ id: "iran-strike-rss-4d", lookbackDays: 4 }));

  // End-to-end flow: pull raw items, then turn them into normalized events.
  const rssItems = await runIngestPlugins(registry.list("ingest"));
  const events = await runAgentPipeline(rssItems, createDefaultStages());

  if (events.length === 0) {
    // Short-circuit avoids empty write operations.
    return 0;
  }

  const db = getDbPool();
  let inserted = 0;
  for (const event of events) {
    // Upsert by dedupe key keeps recurring reports from creating duplicate map points.
    const result = await db.query(
      `INSERT INTO events (
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
      )
      VALUES (
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
        event_time = EXCLUDED.event_time,
        confidence = EXCLUDED.confidence,
        actor_nationality = EXCLUDED.actor_nationality,
        target_nationality = EXCLUDED.target_nationality,
        blast_radius_m = EXCLUDED.blast_radius_m,
        raw_text = EXCLUDED.raw_text,
        sources = EXCLUDED.sources,
        geometry = EXCLUDED.geometry
      RETURNING (xmax = 0) AS inserted`,
      [
        event.eventTime,
        event.confidence,
        event.eventType,
        event.actorNationality ?? null,
        event.targetNationality ?? null,
        event.radiusM ?? null,
        event.rawText,
        event.dedupeKey,
        // Explicit JSON serialization keeps driver behavior consistent across runtimes.
        JSON.stringify(event.sources),
        event.lon,
        event.lat
      ]
    );
    // Postgres returns inserted=true only for brand new rows in this run.
    if (result.rows[0]?.inserted) {
      inserted += 1;
    }
  }

  return inserted;
}
