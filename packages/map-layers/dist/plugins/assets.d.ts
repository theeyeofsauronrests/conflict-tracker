import { SymbolLayer } from "@accelint/map-toolkit/deckgl/symbol-layer";
import type { AssetPosition } from "@conflict-tracker/data-model";
export declare function createAssetsLayer(assets: AssetPosition[]): SymbolLayer<{
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
}, {}>;
//# sourceMappingURL=assets.d.ts.map