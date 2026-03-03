import type { Event, ForcePosition, AssetPosition } from "@conflict-tracker/data-model";
export declare function getDefaultViewport(): {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
};
export declare function createPrimaryLayers(events: Event[], forces: ForcePosition[], assets: AssetPosition[]): (import("@accelint/map-toolkit/deckgl/symbol-layer").SymbolLayer<{
    assetId: string;
    observedTime: string;
    confidence: number;
    lon: number;
    lat: number;
    sources: {
        url: string;
        provider: string;
        title?: string | undefined;
        publishedAt?: string | undefined;
    }[];
}, {}> | import("@accelint/map-toolkit/deckgl/symbol-layer").SymbolLayer<{
    forceId: string;
    observedTime: string;
    nationality: string;
    unitType: string;
    confidence: number;
    lon: number;
    lat: number;
    sources: {
        url: string;
        provider: string;
        title?: string | undefined;
        publishedAt?: string | undefined;
    }[];
    id?: string | undefined;
}, {}> | import("@accelint/map-toolkit/deckgl/symbol-layer").SymbolLayer<{
    eventType: "strike" | "intercept";
    eventTime: string;
    confidence: number;
    rawText: string;
    dedupeKey: string;
    lon: number;
    lat: number;
    sources: {
        url: string;
        provider: string;
        title?: string | undefined;
        publishedAt?: string | undefined;
    }[];
    id?: string | undefined;
    ingestedAt?: string | undefined;
    actorNationality?: string | undefined;
    targetNationality?: string | undefined;
    radiusM?: number | undefined;
}, {}>)[];
export declare function createOptionalLayers(events: Event[]): (import("@deck.gl/aggregation-layers").HexagonLayer<{
    eventType: "strike" | "intercept";
    eventTime: string;
    confidence: number;
    rawText: string;
    dedupeKey: string;
    lon: number;
    lat: number;
    sources: {
        url: string;
        provider: string;
        title?: string | undefined;
        publishedAt?: string | undefined;
    }[];
    id?: string | undefined;
    ingestedAt?: string | undefined;
    actorNationality?: string | undefined;
    targetNationality?: string | undefined;
    radiusM?: number | undefined;
}, {}> | import("@deck.gl/aggregation-layers").HeatmapLayer<{
    eventType: "strike" | "intercept";
    eventTime: string;
    confidence: number;
    rawText: string;
    dedupeKey: string;
    lon: number;
    lat: number;
    sources: {
        url: string;
        provider: string;
        title?: string | undefined;
        publishedAt?: string | undefined;
    }[];
    id?: string | undefined;
    ingestedAt?: string | undefined;
    actorNationality?: string | undefined;
    targetNationality?: string | undefined;
    radiusM?: number | undefined;
}, {}>)[];
//# sourceMappingURL=index.d.ts.map