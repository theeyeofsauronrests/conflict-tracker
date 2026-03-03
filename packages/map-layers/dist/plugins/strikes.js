import { SymbolLayer } from "@accelint/map-toolkit/deckgl/symbol-layer";
export function createStrikesLayer(events) {
    // Show only strike events in this layer.
    const data = events.filter((event) => event.eventType === "strike");
    return new SymbolLayer({
        id: "strikes-layer",
        data,
        getPosition: (d) => [d.lon, d.lat],
        getSidc: () => "SFGPUCI----K",
        getSize: () => 22,
        pickable: true
    });
}
