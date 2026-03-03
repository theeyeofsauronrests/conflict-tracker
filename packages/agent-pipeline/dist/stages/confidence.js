import crypto from "node:crypto";
import { eventSchema } from "@conflict-tracker/data-model";
export const confidenceStage = {
    id: "confidence",
    run: async (ctx) => {
        // Apply a transparent baseline scoring rule and emit validated event objects.
        ctx.scored = ctx.deduped.map((entry) => eventSchema.parse({
            eventType: entry.eventType,
            eventTime: entry.eventTime,
            confidence: /confirmed|video|satellite/i.test(entry.rawText) ? 0.83 : 0.58,
            rawText: entry.rawText,
            dedupeKey: crypto
                .createHash("sha256")
                .update(`${entry.eventType}|${entry.eventTime}|${entry.lon}|${entry.lat}|${entry.rawText}`)
                .digest("hex"),
            lon: entry.lon,
            lat: entry.lat,
            actorNationality: entry.actorNationality,
            targetNationality: entry.targetNationality,
            radiusM: 250,
            sources: [
                {
                    url: entry.rss.url,
                    provider: entry.rss.sourceName,
                    title: entry.rss.title,
                    publishedAt: entry.rss.publishedAt
                }
            ]
        }));
        return ctx;
    }
};
