import { SymbolLayer } from "@accelint/map-toolkit/deckgl/symbol-layer";
import type { ForcePosition } from "@conflict-tracker/data-model";
export declare function createForcesLayer(forces: ForcePosition[]): SymbolLayer<{
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
}, {}>;
//# sourceMappingURL=forces.d.ts.map