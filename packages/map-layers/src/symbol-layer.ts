import { ScatterplotLayer, type ScatterplotLayerProps } from "@deck.gl/layers";

export interface SymbolLayerProps<TData> extends Omit<ScatterplotLayerProps<TData>, "getRadius"> {
  getSidc?: (item: TData) => string;
  getSize?: (item: TData) => number;
}

// Lightweight SymbolLayer shim for local/offline development.
// It preserves the plugin contract while rendering via ScatterplotLayer in 2D mode.
export class SymbolLayer<TData = unknown> extends ScatterplotLayer<TData> {
  constructor(props: SymbolLayerProps<TData>) {
    const getSize = props.getSize ?? (() => 10);
    super({
      ...props,
      getRadius: (item: TData) => getSize(item) * 700,
      radiusMinPixels: 4,
      radiusMaxPixels: 28,
      stroked: true,
      lineWidthMinPixels: 1,
      getFillColor: [229, 231, 235, 210],
      getLineColor: [55, 65, 81, 255]
    });
  }
}
