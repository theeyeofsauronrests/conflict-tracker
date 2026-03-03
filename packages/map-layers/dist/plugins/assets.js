import { SymbolLayer } from "@accelint/map-toolkit/deckgl/symbol-layer";
export function createAssetsLayer(assets) {
    // Asset layer uses a simpler symbol set to reduce visual clutter.
    return new SymbolLayer({
        id: "assets-layer",
        data: assets,
        getPosition: (d) => [d.lon, d.lat],
        getSidc: () => "SFGPEV----K",
        getSize: () => 14,
        pickable: true
    });
}
