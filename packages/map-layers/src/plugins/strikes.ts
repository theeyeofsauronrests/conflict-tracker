import { SymbolLayer } from "../symbol-layer";
import type { Event } from "@conflict-tracker/data-model";

export function createStrikesLayer(events: Event[]) {
  // Show only strike events in this layer.
  const data = events.filter((event) => event.eventType === "strike");
  return new SymbolLayer<Event>({
    id: "strikes-layer",
    data,
    getPosition: (d: Event) => [d.lon, d.lat],
    // Generic hostile strike icon for 2D views.
    getSidc: () => "SFGPUCI----K",
    getSize: () => 22,
    pickable: true
  });
}
