import { describe, expect, it } from "vitest";
import { PluginRegistry } from "./index";
describe("PluginRegistry", () => {
    it("filters plugins by feature flags", () => {
        const registry = new PluginRegistry();
        registry.register({ id: "a", kind: "map", featureFlag: "heatmapLayer", description: "a" });
        registry.register({ id: "b", kind: "map", description: "b" });
        expect(registry.list("map").map((p) => p.id)).toEqual(["a", "b"]);
        registry.setFeatureFlag("heatmapLayer", false);
        expect(registry.list("map").map((p) => p.id)).toEqual(["b"]);
    });
});
