import { NextResponse } from "next/server";
import { loadDelayedFeedData } from "@/lib/events-feed";

export const runtime = "nodejs";

export async function GET() {
  const data = await loadDelayedFeedData();
  return NextResponse.json(data);
}
