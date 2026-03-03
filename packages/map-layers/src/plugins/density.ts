import { HexagonLayer } from "@deck.gl/aggregation-layers";
import type { Event } from "@conflict-tracker/data-model";

export function createDensityLayer(events: Event[]) {
  // Hex bins are useful when teams want count-based density instead of blur.
  return new HexagonLayer<Event>({
    id: "density-layer",
    data: events,
    getPosition: (d) => [d.lon, d.lat],
    radius: 5000,
    elevationScale: 20,
    extruded: false
  });
}
