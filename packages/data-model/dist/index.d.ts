import { z } from "zod";
export declare const sourceSchema: z.ZodObject<{
    url: z.ZodString;
    provider: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    publishedAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const eventSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    eventType: z.ZodEnum<{
        strike: "strike";
        intercept: "intercept";
    }>;
    eventTime: z.ZodString;
    ingestedAt: z.ZodOptional<z.ZodString>;
    confidence: z.ZodNumber;
    actorNationality: z.ZodOptional<z.ZodString>;
    targetNationality: z.ZodOptional<z.ZodString>;
    rawText: z.ZodString;
    dedupeKey: z.ZodString;
    radiusM: z.ZodOptional<z.ZodNumber>;
    lon: z.ZodNumber;
    lat: z.ZodNumber;
    sources: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        provider: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        publishedAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const forcePositionSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    forceId: z.ZodString;
    observedTime: z.ZodString;
    nationality: z.ZodString;
    unitType: z.ZodString;
    confidence: z.ZodNumber;
    lon: z.ZodNumber;
    lat: z.ZodNumber;
    sources: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        provider: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        publishedAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const assetSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    nationality: z.ZodString;
    assetType: z.ZodString;
}, z.core.$strip>;
export declare const assetPositionSchema: z.ZodObject<{
    assetId: z.ZodString;
    observedTime: z.ZodString;
    confidence: z.ZodNumber;
    lon: z.ZodNumber;
    lat: z.ZodNumber;
    sources: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        provider: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        publishedAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const rssItemSchema: z.ZodObject<{
    sourceId: z.ZodString;
    sourceName: z.ZodString;
    url: z.ZodString;
    publishedAt: z.ZodString;
    title: z.ZodString;
    text: z.ZodString;
}, z.core.$strip>;
export type Source = z.infer<typeof sourceSchema>;
export type Event = z.infer<typeof eventSchema>;
export type ForcePosition = z.infer<typeof forcePositionSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type AssetPosition = z.infer<typeof assetPositionSchema>;
export type RssItem = z.infer<typeof rssItemSchema>;
//# sourceMappingURL=index.d.ts.map