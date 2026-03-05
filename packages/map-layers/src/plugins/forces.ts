import { ScatterplotLayer } from "@deck.gl/layers";
import type { ForcePosition } from "@conflict-tracker/data-model";

export function createForcesLayer(forces: ForcePosition[]) {
  // Force positions use smaller points so they do not overwhelm strike/intercept markers.
  return new ScatterplotLayer<ForcePosition>({
    id: "forces-layer",
    data: forces,
    getPosition: (d: ForcePosition) => [d.lon, d.lat],
    getRadius: (d: ForcePosition) => (d.unitType.toLowerCase().includes("air") ? 9000 : 7000),
    radiusMinPixels: 3,
    radiusMaxPixels: 10,
    filled: true,
    stroked: true,
    getFillColor: (d: ForcePosition) => (d.unitType.toLowerCase().includes("air") ? [16, 185, 129, 180] : [34, 197, 94, 180]),
    getLineColor: () => [20, 83, 45, 255],
    lineWidthMinPixels: 1,
    pickable: true
  });
}
