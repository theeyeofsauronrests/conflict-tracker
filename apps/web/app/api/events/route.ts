import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const db = getDbPool();

  // Public response is still fed strictly from delay-enforced views.
  const [eventsResult, forcesResult, assetsResult] = await Promise.all([
    db.query(
      `SELECT
        id::text,
        event_time AS "eventTime",
        confidence,
        event_type AS "eventType",
        actor_nationality AS "actorNationality",
        target_nationality AS "targetNationality",
        radius_m AS "radiusM",
        raw_text AS "rawText",
        dedupe_key AS "dedupeKey",
        sources,
        lon,
        lat
      FROM public_events_delayed
      ORDER BY event_time DESC
      LIMIT 1500`
    ),
    db.query(
      `SELECT
        id::text,
        force_id AS "forceId",
        nationality,
        unit_type AS "unitType",
        observed_time AS "observedTime",
        confidence,
        sources,
        lon,
        lat
      FROM public_force_positions_delayed
      ORDER BY observed_time DESC
      LIMIT 1500`
    ),
    db.query(
      `SELECT
        asset_id::text AS "assetId",
        observed_time AS "observedTime",
        confidence,
        sources,
        lon,
        lat
      FROM public_asset_positions_delayed
      ORDER BY observed_time DESC
      LIMIT 1500`
    )
  ]);

  return NextResponse.json({
    events: eventsResult.rows,
    forces: forcesResult.rows,
    assets: assetsResult.rows
  });
}
