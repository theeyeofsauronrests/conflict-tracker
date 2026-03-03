import { SymbolLayer } from "@accelint/map-toolkit/deckgl/symbol-layer";
import type { Event } from "@conflict-tracker/data-model";
export declare function createStrikesLayer(events: Event[]): SymbolLayer<{
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
}, {}>;
//# sourceMappingURL=strikes.d.ts.map