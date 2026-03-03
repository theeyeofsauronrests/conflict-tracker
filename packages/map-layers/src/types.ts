import type { Event, ForcePosition, AssetPosition } from "@conflict-tracker/data-model";

export interface MapLayerData {
  events: Event[];
  forces: ForcePosition[];
  assets: AssetPosition[];
}
