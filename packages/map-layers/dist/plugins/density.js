import { HexagonLayer } from "@deck.gl/aggregation-layers";
export function createDensityLayer(events) {
    // Hex bins are useful when teams want count-based density instead of blur.
    return new HexagonLayer({
        id: "density-layer",
        data: events,
        getPosition: (d) => [d.lon, d.lat],
        radius: 5000,
        elevationScale: 20,
        extruded: false
    });
}
