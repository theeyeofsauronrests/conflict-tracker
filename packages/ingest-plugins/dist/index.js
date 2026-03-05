import { XMLParser } from "fast-xml-parser";
import { rssItemSchema } from "@conflict-tracker/data-model";
export function createRssIngestPlugin(config) {
    return {
        id: config.id,
        kind: "ingest",
        featureFlag: "rssIngest",
        description: `RSS ingest for ${config.sourceName}`,
        run: async () => {
            // Pull feed content with an explicit user agent for better provider compatibility.
            const response = await fetch(config.feedUrl, {
                headers: { "User-Agent": "conflict-tracker-ingestor/0.1" }
            });
            const xml = await response.text();
            const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
            const parsed = parser.parse(xml);
            const entries = parsed?.rss?.channel?.item;
            const items = Array.isArray(entries) ? entries : entries ? [entries] : [];
            return items
                // Convert provider-specific fields into our shared normalized RSS shape.
                .map((item) => rssItemSchema.parse({
                sourceId: config.id,
                sourceName: config.sourceName,
                url: item.link,
                publishedAt: new Date(item.pubDate || Date.now()).toISOString(),
                title: item.title || "",
                text: item.description || item.title || ""
            }))
                // Keep each run bounded to avoid oversized pipeline batches.
                .slice(0, 200);
        }
    };
}
function isIranConflictSignal(text) {
    return /iran/i.test(text) && /(strike|strikes|intercept|interception|missile|drone|air defense|attack)/i.test(text);
}
export function createIranConflictRssPlugin(config) {
    const feedUrl = "https://news.google.com/rss/search?q=iran+strike+OR+iran+intercept+OR+iran+missile+OR+iran+drone&hl=en-US&gl=US&ceid=US:en";
    const cutoff = Date.now() - config.lookbackDays * 24 * 60 * 60 * 1000;
    return {
        id: config.id,
        kind: "ingest",
        featureFlag: "rssIngest",
        description: `Iran strike/intercept scrape from web RSS in the last ${config.lookbackDays} days`,
        run: async () => {
            // This feed provides article links from many outlets without requiring an API key.
            const baseItems = await createRssIngestPlugin({
                id: config.id,
                sourceName: "Google News (Iran conflict search)",
                feedUrl
            }).run();
            return baseItems
                .filter((item) => {
                const publishedAt = new Date(item.publishedAt).getTime();
                if (Number.isNaN(publishedAt) || publishedAt < cutoff) {
                    return false;
                }
                return isIranConflictSignal(`${item.title} ${item.text}`);
            })
                .slice(0, 150);
        }
    };
}
export async function runIngestPlugins(plugins) {
    // One plugin failure should not block the others.
    const runs = await Promise.allSettled(plugins.map((plugin) => plugin.run()));
    return runs.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}
