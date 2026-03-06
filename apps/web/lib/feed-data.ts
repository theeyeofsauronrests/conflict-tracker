import type { AssetPosition, Event, ForcePosition } from "@conflict-tracker/data-model";
import { headers } from "next/headers";

export async function getFeedData(): Promise<{ events: Event[]; forces: ForcePosition[]; assets: AssetPosition[] }> {
  // Server-side fetch keeps API keys and data access logic out of the browser.
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? (host ? `${protocol}://${host}` : "http://localhost:3000");

  const response = await fetch(`${baseUrl}/api/events`, {
    cache: "no-store"
  });
  if (!response.ok) {
    return { events: [], forces: [], assets: [] };
  }
  return response.json();
}
