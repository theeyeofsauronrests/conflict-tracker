function classifyEventType(text) {
    // Keep this simple and transparent for now: keyword-based routing.
    return /intercept/i.test(text) ? "intercept" : "strike";
}
const iranLocationHints = [
    { pattern: /\btehran\b/i, lon: 51.389, lat: 35.6892 },
    { pattern: /\bisfahan\b/i, lon: 51.6776, lat: 32.6546 },
    { pattern: /\btabriz\b/i, lon: 46.2919, lat: 38.0962 },
    { pattern: /\bashdod\b/i, lon: 34.6553, lat: 31.8044 },
    { pattern: /\bhaifa\b/i, lon: 34.9896, lat: 32.794 },
    { pattern: /\biraq\b/i, lon: 43.6793, lat: 33.2232 },
    { pattern: /\bsyria\b/i, lon: 36.2765, lat: 33.5138 }
];
function inferPoint(text) {
    for (const hint of iranLocationHints) {
        if (hint.pattern.test(text)) {
            return { lon: hint.lon, lat: hint.lat };
        }
    }
    // Fallback keeps unknown reports near the main Iran theater.
    return { lon: 53.688, lat: 32.4279 };
}
export function createParseStage() {
    return {
        id: "parse",
        run: async (ctx) => {
            // Local-only parse path with deterministic heuristics and no external model calls.
            ctx.parsed = ctx.rssItems.map((item) => {
                const mergedText = `${item.title} ${item.text}`;
                const point = inferPoint(mergedText);
                return {
                    rss: item,
                    eventType: classifyEventType(mergedText),
                    eventTime: item.publishedAt,
                    rawText: item.text,
                    lon: point.lon,
                    lat: point.lat
                };
            });
            return ctx;
        }
    };
}
