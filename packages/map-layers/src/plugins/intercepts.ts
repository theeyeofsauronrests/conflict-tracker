import { ScatterplotLayer } from "@deck.gl/layers";
import type { Event } from "@conflict-tracker/data-model";

export function createInterceptsLayer(events: Event[]) {
  // Separate intercepts so they can be toggled and read independently.
  const data = events.filter((event) => event.eventType === "intercept");
  return new ScatterplotLayer<Event>({
    id: "intercepts-layer",
    data,
    getPosition: (d: Event) => [d.lon, d.lat],
    getRadius: () => 11000,
    radiusMinPixels: 4,
    radiusMaxPixels: 12,
    filled: true,
    stroked: true,
    getFillColor: () => [59, 130, 246, 190],
    getLineColor: () => [30, 58, 138, 255],
    lineWidthMinPixels: 1.5,
    pickable: true
  });
}
