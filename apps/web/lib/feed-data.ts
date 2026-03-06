import type { FeedData } from "@/lib/events-feed";
import { loadDelayedFeedData } from "@/lib/events-feed";

export async function getFeedData(): Promise<FeedData> {
  // Load directly from delayed DB views to avoid host-header derived fetch targets.
  try {
    return await loadDelayedFeedData();
  } catch {
    return { events: [], forces: [], assets: [] };
  }
}
