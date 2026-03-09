import { SymbolLayer } from "../symbol-layer";
import type { Event } from "@conflict-tracker/data-model";

export function createInterceptsLayer(events: Event[]) {
  // Separate intercepts so they can be toggled and read independently.
  const data = events.filter((event) => event.eventType === "intercept");
  return new SymbolLayer<Event>({
    id: "intercepts-layer",
    data,
    getPosition: (d: Event) => [d.lon, d.lat],
    getSidc: () => "SFGPUCI----L",
    getSize: () => 20,
    pickable: true
  });
}
