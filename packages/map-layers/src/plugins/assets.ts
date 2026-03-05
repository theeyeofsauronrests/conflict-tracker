import { ScatterplotLayer } from "@deck.gl/layers";
import type { AssetPosition } from "@conflict-tracker/data-model";

export function createAssetsLayer(assets: AssetPosition[]) {
  // Assets are rendered as compact neutral markers.
  return new ScatterplotLayer<AssetPosition>({
    id: "assets-layer",
    data: assets,
    getPosition: (d: AssetPosition) => [d.lon, d.lat],
    getRadius: () => 6500,
    radiusMinPixels: 3,
    radiusMaxPixels: 9,
    filled: true,
    stroked: true,
    getFillColor: () => [234, 179, 8, 180],
    getLineColor: () => [133, 77, 14, 255],
    lineWidthMinPixels: 1,
    pickable: true
  });
}
