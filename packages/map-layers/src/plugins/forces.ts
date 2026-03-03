import { SymbolLayer } from "@accelint/map-toolkit/deckgl/symbol-layer";
import type { ForcePosition } from "@conflict-tracker/data-model";

export function createForcesLayer(forces: ForcePosition[]) {
  // Render force sightings with SIDCs that roughly match air vs ground units.
  return new SymbolLayer({
    id: "forces-layer",
    data: forces,
    getPosition: (d: ForcePosition) => [d.lon, d.lat],
    getSidc: (d: ForcePosition) => (d.unitType.toLowerCase().includes("air") ? "SFGPUCAA---K" : "SFGPUCI----K"),
    getSize: () => 16,
    pickable: true
  });
}
