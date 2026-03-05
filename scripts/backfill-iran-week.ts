import { createDefaultStages, runAgentPipeline } from "@conflict-tracker/agent-pipeline";
import { createRssIngestPlugin, runIngestPlugins } from "@conflict-tracker/ingest-plugins";
import type { Event } from "@conflict-tracker/data-model";
import { getDbPool } from "../apps/web/lib/db";

const LOOKBACK_DAYS = 7;
const FEED_BASE = "https://news.google.com/rss/search";

const QUERY_TERMS = [
  "iran strike",
  "iran intercept",
  "iran missile attack",
  "iran drone attack",
  "iran ballistic missile",
  "israel iran intercept",
  "iran israel strike",
  "iran iraq strike",
  "iran syria strike",
  "tehran missile",
  "isfahan strike",
  "iran air defense intercept"
];

function buildFeedUrl(query: string): string {
  const params = new URLSearchParams({
    q: query,
    hl: "en-US",
    gl: "US",
    ceid: "US:en"
  });
  return `${FEED_BASE}?${params.toString()}`;
}

function isRecent(isoDate: string): boolean {
  const cutoff = Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const publishedAt = new Date(isoDate).getTime();
  return Number.isFinite(publishedAt) && publishedAt >= cutoff;
}

function isConflictSignal(text: string): boolean {
  return /(iran|tehran|isfahan)/i.test(text) && /(strike|intercept|missile|drone|rocket|air defense|attack)/i.test(text);
}

async function upsertEvents(events: Event[]): Promise<number> {
  const db = getDbPool();
  let inserted = 0;

  for (const event of events) {
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
        confidence = EXCLUDED.confidence,
        actor_nationality = EXCLUDED.actor_nationality,
        target_nationality = EXCLUDED.target_nationality,
        blast_radius_m = EXCLUDED.blast_radius_m,
        raw_text = EXCLUDED.raw_text,
        sources = EXCLUDED.sources
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
        JSON.stringify(event.sources),
        event.lon,
        event.lat
      ]
    );

    if (result.rows[0]?.inserted) {
      inserted += 1;
    }
  }

  return inserted;
}

async function main() {
  const plugins = QUERY_TERMS.map((query, index) =>
    createRssIngestPlugin({
      id: `iran-backfill-${index + 1}`,
      sourceName: `Google News (${query})`,
      feedUrl: buildFeedUrl(query)
    })
  );

  const rssItems = await runIngestPlugins(plugins);
  const filteredItems = rssItems.filter((item) => isRecent(item.publishedAt) && isConflictSignal(`${item.title} ${item.text}`));
  const events = await runAgentPipeline(filteredItems, createDefaultStages());
  const inserted = await upsertEvents(events);

  const db = getDbPool();
  const countResult = await db.query(
    `SELECT count(*)::int AS count
     FROM events
     WHERE event_time >= now() - interval '7 days'`
  );
  const weekCount = countResult.rows[0]?.count ?? 0;

  console.log(`Backfill complete. Parsed ${events.length} events, inserted ${inserted} new rows.`);
  console.log(`Events in last 7 days: ${weekCount}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
