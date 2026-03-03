import crypto from "node:crypto";
import type { AgentStage } from "../types";

export const dedupeStage: AgentStage = {
  id: "dedupe",
  run: async (ctx) => {
    // Hash a stable fingerprint so repeated reports collapse into one event.
    const seen = new Set<string>();
    ctx.deduped = ctx.normalized.filter((event) => {
      const key = crypto
        .createHash("sha256")
        .update(`${event.eventType}:${event.eventTime}:${event.lon.toFixed(3)}:${event.lat.toFixed(3)}:${event.rawText}`)
        .digest("hex");
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    return ctx;
  }
};
