import { SymbolLayer } from "@accelint/map-toolkit/deckgl/symbol-layer";
import type { Event } from "@conflict-tracker/data-model";

export function createStrikesLayer(events: Event[]) {
  // Show only strike events in this layer.
  const data = events.filter((event) => event.eventType === "strike");
  return new SymbolLayer({
    id: "strikes-layer",
    data,
    getPosition: (d: Event) => [d.lon, d.lat],
    getSidc: () => "SFGPUCI----K",
    getSize: () => 22,
    pickable: true
  });
}
