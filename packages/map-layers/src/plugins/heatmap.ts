import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import type { Event } from "@conflict-tracker/data-model";

export function createHeatmapLayer(events: Event[]) {
  // Heatmap gives a quick "where activity clusters" view.
  return new HeatmapLayer<Event>({
    id: "heatmap-layer",
    data: events,
    getPosition: (d) => [d.lon, d.lat],
    getWeight: (d) => d.confidence,
    radiusPixels: 35
  });
}
