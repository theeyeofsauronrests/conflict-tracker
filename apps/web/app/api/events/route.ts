import { NextResponse } from "next/server";
import { createAnonClient } from "@/lib/supabase";

export async function GET() {
  // Public users read through delayed views only (never raw source tables).
  const supabase = createAnonClient();

  // Load each public feed in parallel to keep map load time predictable.
  const [eventsResult, forcesResult, assetsResult] = await Promise.all([
    supabase.from("public_events_delayed").select("*").order("event_time", { ascending: false }).limit(1500),
    supabase
      .from("public_force_positions_delayed")
      .select("*")
      .order("observed_time", { ascending: false })
      .limit(1500),
    supabase.from("public_asset_positions_delayed").select("*").order("observed_time", { ascending: false }).limit(1500)
  ]);

  return NextResponse.json({
    events: eventsResult.data ?? [],
    forces: forcesResult.data ?? [],
    assets: assetsResult.data ?? []
  });
}
