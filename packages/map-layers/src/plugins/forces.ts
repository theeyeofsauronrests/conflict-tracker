import { SymbolLayer } from "../symbol-layer";
import type { ForcePosition } from "@conflict-tracker/data-model";

export function createForcesLayer(forces: ForcePosition[]) {
  // Force positions use doctrinal symbols instead of generic circles.
  return new SymbolLayer<ForcePosition>({
    id: "forces-layer",
    data: forces,
    getPosition: (d: ForcePosition) => [d.lon, d.lat],
    getSidc: (d: ForcePosition) => (d.unitType.toLowerCase().includes("air") ? "SFGPUCAA---K" : "SFGPUCIL---K"),
    getSize: () => 18,
    pickable: true
  });
}
