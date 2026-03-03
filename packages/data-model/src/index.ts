import { z } from "zod";

// Shared source reference attached to every event or position claim.
export const sourceSchema = z.object({
  url: z.string().url(),
  provider: z.string().min(1),
  title: z.string().optional(),
  publishedAt: z.string().datetime().optional()
});

export const eventSchema = z.object({
  id: z.string().uuid().optional(),
  eventType: z.enum(["strike", "intercept"]),
  eventTime: z.string().datetime(),
  ingestedAt: z.string().datetime().optional(),
  confidence: z.number().min(0).max(1),
  actorNationality: z.string().min(1).optional(),
  targetNationality: z.string().min(1).optional(),
  rawText: z.string().min(1),
  dedupeKey: z.string().min(1),
  radiusM: z.number().int().nonnegative().optional(),
  lon: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  sources: z.array(sourceSchema).min(1)
});

// Time-versioned force positions (append-only history).
export const forcePositionSchema = z.object({
  id: z.string().uuid().optional(),
  forceId: z.string().min(1),
  observedTime: z.string().datetime(),
  nationality: z.string().min(1),
  unitType: z.string().min(1),
  confidence: z.number().min(0).max(1),
  lon: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  sources: z.array(sourceSchema).min(1)
});

export const assetSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  nationality: z.string().min(1),
  assetType: z.string().min(1)
});

// Time-versioned asset movement records.
export const assetPositionSchema = z.object({
  assetId: z.string().uuid(),
  observedTime: z.string().datetime(),
  confidence: z.number().min(0).max(1),
  lon: z.number().min(-180).max(180),
  lat: z.number().min(-90).max(90),
  sources: z.array(sourceSchema).min(1)
});

// Raw RSS record before enrichment stages run.
export const rssItemSchema = z.object({
  sourceId: z.string().min(1),
  sourceName: z.string().min(1),
  url: z.string().url(),
  publishedAt: z.string().datetime(),
  title: z.string().min(1),
  text: z.string().min(1)
});

// Inferred types keep frontend, API, and pipeline on one shared contract.
export type Source = z.infer<typeof sourceSchema>;
export type Event = z.infer<typeof eventSchema>;
export type ForcePosition = z.infer<typeof forcePositionSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type AssetPosition = z.infer<typeof assetPositionSchema>;
export type RssItem = z.infer<typeof rssItemSchema>;
