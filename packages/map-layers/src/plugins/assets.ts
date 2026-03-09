import { SymbolLayer } from "../symbol-layer";
import type { AssetPosition } from "@conflict-tracker/data-model";

export function createAssetsLayer(assets: AssetPosition[]) {
  // Assets are rendered with neutral symbols to keep them distinct from events.
  return new SymbolLayer<AssetPosition>({
    id: "assets-layer",
    data: assets,
    getPosition: (d: AssetPosition) => [d.lon, d.lat],
    getSidc: () => "SFGPEWRH---K",
    getSize: () => 16,
    pickable: true
  });
}
