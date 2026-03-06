import crypto from "node:crypto";
import { eventSchema } from "@conflict-tracker/data-model";
import type { AgentStage } from "../types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function scoreConfidence(text: string): number {
  let score = 0.58;

  // Strong corroboration signals.
  if (/\bconfirmed|video|satellite|imagery|osint\b/i.test(text)) {
    score += 0.18;
  }

  // Official statements can raise confidence slightly.
  if (/\bministry|official|military statement|defense ministry|spokesperson\b/i.test(text)) {
    score += 0.08;
  }

  // Uncertain attribution should reduce confidence.
  if (/\balleged|suspected|reportedly|unverified|unclear|possible\b/i.test(text)) {
    score -= 0.2;
  }

  // Explicit negation of attribution is a significant downgrade.
  if (/\bnot\s+(?:from|by|launched from|launched by|attributed to)\b/i.test(text)) {
    score -= 0.28;
  }

  return clamp(score, 0.2, 0.92);
}

export const confidenceStage: AgentStage = {
  id: "confidence",
  run: async (ctx) => {
    // Apply a transparent baseline scoring rule and emit validated event objects.
    ctx.scored = ctx.deduped.map((entry) =>
      eventSchema.parse({
        eventType: entry.eventType,
        eventTime: entry.eventTime,
        confidence: scoreConfidence(`${entry.rss.title} ${entry.rawText}`),
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
      })
    );
    return ctx;
  }
};
