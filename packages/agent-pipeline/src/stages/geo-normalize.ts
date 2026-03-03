import { normalizeObjectToLatLon } from "@accelint/geo";
import type { AgentStage } from "../types";

export const geoNormalizeStage: AgentStage = {
  id: "geo-normalize",
  run: async (ctx) => {
    // Standardize coordinate shape so later stages can trust lon/lat fields.
    ctx.normalized = ctx.parsed.map((entry) => {
      const normalized = normalizeObjectToLatLon({ longitude: entry.lon, latitude: entry.lat });
      return {
        ...entry,
        lon: normalized?.lon ?? entry.lon,
        lat: normalized?.lat ?? entry.lat
      };
    });
    return ctx;
  }
};
