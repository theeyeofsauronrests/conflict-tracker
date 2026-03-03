import { SymbolLayer } from "@accelint/map-toolkit/deckgl/symbol-layer";
export function createInterceptsLayer(events) {
    // Separate intercepts so they can be toggled and read independently.
    const data = events.filter((event) => event.eventType === "intercept");
    return new SymbolLayer({
        id: "intercepts-layer",
        data,
        getPosition: (d) => [d.lon, d.lat],
        getSidc: () => "SFGPUCD----K",
        getSize: () => 18,
        pickable: true
    });
}
