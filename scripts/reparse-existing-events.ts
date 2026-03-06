import { parseRssItem } from "@conflict-tracker/agent-pipeline";
import { getDbPool } from "../apps/web/lib/db";

const DEFAULT_LOOKBACK_HOURS = 24 * 7;
const FALLBACK_LON = 53.688;
const FALLBACK_LAT = 32.4279;

type EventRow = {
  id: string;
  event_time: string;
  raw_text: string;
  sources: Array<{ url?: string; provider?: string; title?: string; publishedAt?: string }>;
};

async function main() {
  const argHours = Number(process.argv[2] ?? "");
  const lookbackHours = Number.isFinite(argHours) && argHours > 0 ? argHours : DEFAULT_LOOKBACK_HOURS;
  const db = getDbPool();

  const eventsResult = await db.query<EventRow>(
    `SELECT
      id::text,
      event_time::text,
      raw_text,
      sources
    FROM events
    WHERE event_time >= now() - ($1::int * interval '1 hour')`,
    [lookbackHours]
  );

  let updated = 0;
  for (const row of eventsResult.rows) {
    const firstSource = Array.isArray(row.sources) ? row.sources[0] : undefined;
    const parsed = parseRssItem({
      sourceId: "reparse",
      sourceName: firstSource?.provider ?? "stored-source",
      url: firstSource?.url ?? `https://local.invalid/event/${row.id}`,
      publishedAt: firstSource?.publishedAt ?? new Date(row.event_time).toISOString(),
      title: firstSource?.title ?? "",
      text: row.raw_text
    });

    await db.query(
      `UPDATE events
       SET
         actor_nationality = COALESCE($2::text, actor_nationality),
         target_nationality = COALESCE($3::text, target_nationality),
         geometry = CASE
           WHEN abs(ST_X(geometry::geometry) - $4::double precision) < 0.0001
             AND abs(ST_Y(geometry::geometry) - $5::double precision) < 0.0001
           THEN ST_SetSRID(ST_MakePoint($6::double precision, $7::double precision), 4326)
           ELSE geometry
         END
       WHERE id = $1::uuid`,
      [row.id, parsed.actorNationality ?? null, parsed.targetNationality ?? null, FALLBACK_LON, FALLBACK_LAT, parsed.lon, parsed.lat]
    );
    updated += 1;
  }

  const metrics = await db.query(
    `SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE actor_nationality IS NULL OR lower(actor_nationality) = 'unknown')::int AS actor_unknown,
      count(*) FILTER (WHERE target_nationality IS NULL OR lower(target_nationality) = 'unknown')::int AS target_unknown
     FROM events
     WHERE event_time >= now() - ($1::int * interval '1 hour')`,
    [lookbackHours]
  );

  const row = metrics.rows[0];
  console.log(`Reparse complete for last ${lookbackHours} hours. Updated ${updated} rows.`);
  console.log(`Totals: ${row?.total ?? 0} events, actor unknown: ${row?.actor_unknown ?? 0}, target unknown: ${row?.target_unknown ?? 0}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
