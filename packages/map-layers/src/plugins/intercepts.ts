import { SymbolLayer } from "@accelint/map-toolkit/deckgl/symbol-layer";
import type { Event } from "@conflict-tracker/data-model";

export function createInterceptsLayer(events: Event[]) {
  // Separate intercepts so they can be toggled and read independently.
  const data = events.filter((event) => event.eventType === "intercept");
  return new SymbolLayer({
    id: "intercepts-layer",
    data,
    getPosition: (d: Event) => [d.lon, d.lat],
    getSidc: () => "SFGPUCD----K",
    getSize: () => 18,
    pickable: true
  });
}
