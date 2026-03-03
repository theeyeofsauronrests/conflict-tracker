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
export async function runIngestPlugins(plugins) {
    // One plugin failure should not block the others.
    const runs = await Promise.allSettled(plugins.map((plugin) => plugin.run()));
    return runs.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}
