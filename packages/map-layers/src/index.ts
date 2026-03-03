import type { Event, ForcePosition, AssetPosition } from "@conflict-tracker/data-model";
import { createAssetsLayer } from "./plugins/assets";
import { createDensityLayer } from "./plugins/density";
import { createForcesLayer } from "./plugins/forces";
import { createHeatmapLayer } from "./plugins/heatmap";
import { createInterceptsLayer } from "./plugins/intercepts";
import { createStrikesLayer } from "./plugins/strikes";

export function getDefaultViewport() {
  // Start centered on the main operational region.
  return {
    longitude: 44.3661,
    latitude: 33.3152,
    zoom: 4,
    pitch: 0,
    bearing: 0
  };
}

export function createPrimaryLayers(events: Event[], forces: ForcePosition[], assets: AssetPosition[]) {
  // These are the always-on mission layers for daily use.
  return [createStrikesLayer(events), createInterceptsLayer(events), createForcesLayer(forces), createAssetsLayer(assets)];
}

export function createOptionalLayers(events: Event[]) {
  // Optional overlays for density-style analysis views.
  return [createHeatmapLayer(events), createDensityLayer(events)];
}
