import { SymbolLayer } from "@accelint/map-toolkit/deckgl/symbol-layer";
import type { AssetPosition } from "@conflict-tracker/data-model";

export function createAssetsLayer(assets: AssetPosition[]) {
  // Asset layer uses a simpler symbol set to reduce visual clutter.
  return new SymbolLayer({
    id: "assets-layer",
    data: assets,
    getPosition: (d: AssetPosition) => [d.lon, d.lat],
    getSidc: () => "SFGPEV----K",
    getSize: () => 14,
    pickable: true
  });
}
