import { HeatmapLayer } from "@deck.gl/aggregation-layers";
export function createHeatmapLayer(events) {
    // Heatmap gives a quick "where activity clusters" view.
    return new HeatmapLayer({
        id: "heatmap-layer",
        data: events,
        getPosition: (d) => [d.lon, d.lat],
        getWeight: (d) => d.confidence,
        radiusPixels: 35
    });
}
