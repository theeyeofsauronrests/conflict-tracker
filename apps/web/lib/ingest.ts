import { createDefaultStages, runAgentPipeline } from "@conflict-tracker/agent-pipeline";
import { createRssIngestPlugin, runIngestPlugins, type IngestPlugin } from "@conflict-tracker/ingest-plugins";
import { PluginRegistry } from "@conflict-tracker/plugin-registry";
import { createServiceClient } from "./supabase";

function toWktPoint(lon: number, lat: number): string {
  // Supabase/PostGIS accepts WKT for geometry columns.
  return `POINT(${lon} ${lat})`;
}

export async function runIngestion(openaiApiKey?: string): Promise<number> {
  // Registry keeps ingest sources pluggable and easy to extend later.
  const registry = new PluginRegistry<IngestPlugin>();
  registry.register(
    createRssIngestPlugin({
      id: "me-conflict-feed",
      sourceName: "Middle East Conflict Feed",
      feedUrl: "https://www.aljazeera.com/xml/rss/all.xml"
    })
  );

  // End-to-end flow: pull raw items, then turn them into normalized events.
  const rssItems = await runIngestPlugins(registry.list("ingest"));
  const events = await runAgentPipeline(rssItems, createDefaultStages(openaiApiKey));

  const supabase = createServiceClient();
  if (events.length === 0) {
    // Short-circuit avoids empty write operations.
    return 0;
  }

  // Convert shared app shape into DB-ready rows.
  const payload = events.map((event) => ({
    event_time: event.eventTime,
    ingested_at: new Date().toISOString(),
    confidence: event.confidence,
    event_type: event.eventType,
    actor_nationality: event.actorNationality ?? null,
    target_nationality: event.targetNationality ?? null,
    blast_radius_m: event.radiusM ?? null,
    raw_text: event.rawText,
    dedupe_key: event.dedupeKey,
    sources: event.sources,
    geometry: toWktPoint(event.lon, event.lat)
  }));

  const { error } = await supabase.from("events").upsert(payload, { onConflict: "dedupe_key" });
  if (error) {
    // Bubble up so cron route can alert on failures.
    throw error;
  }

  return payload.length;
}
