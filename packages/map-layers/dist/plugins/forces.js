import { SymbolLayer } from "@accelint/map-toolkit/deckgl/symbol-layer";
export function createForcesLayer(forces) {
    // Render force sightings with SIDCs that roughly match air vs ground units.
    return new SymbolLayer({
        id: "forces-layer",
        data: forces,
        getPosition: (d) => [d.lon, d.lat],
        getSidc: (d) => (d.unitType.toLowerCase().includes("air") ? "SFGPUCAA---K" : "SFGPUCI----K"),
        getSize: () => 16,
        pickable: true
    });
}
