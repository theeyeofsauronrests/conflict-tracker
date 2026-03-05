import { ScatterplotLayer } from "@deck.gl/layers";
import type { Event } from "@conflict-tracker/data-model";

export function createStrikesLayer(events: Event[]) {
  // Show only strike events in this layer.
  const data = events.filter((event) => event.eventType === "strike");
  return new ScatterplotLayer<Event>({
    id: "strikes-layer",
    data,
    getPosition: (d: Event) => [d.lon, d.lat],
    getRadius: () => 14000,
    radiusMinPixels: 5,
    radiusMaxPixels: 14,
    filled: true,
    stroked: true,
    getFillColor: () => [239, 68, 68, 200],
    getLineColor: () => [127, 29, 29, 255],
    lineWidthMinPixels: 1.5,
    pickable: true
  });
}
