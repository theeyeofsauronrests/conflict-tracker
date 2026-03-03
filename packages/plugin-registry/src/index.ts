export type FeatureFlag = "rssIngest" | "agentPipeline" | "heatmapLayer" | "densityLayer";

export type PluginKind = "ingest" | "agent" | "map";

export interface PluginContract<TConfig = unknown> {
  id: string;
  kind: PluginKind;
  featureFlag?: FeatureFlag;
  description: string;
  configSchema?: TConfig;
}

export class PluginRegistry<TPlugin extends PluginContract> {
  // Use maps for fast lookups by id and feature flag.
  private readonly plugins = new Map<string, TPlugin>();
  private readonly flags = new Map<FeatureFlag, boolean>();

  register(plugin: TPlugin): void {
    // Guard against accidental double-registration.
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin already registered: ${plugin.id}`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  setFeatureFlag(flag: FeatureFlag, enabled: boolean): void {
    this.flags.set(flag, enabled);
  }

  list(kind?: PluginKind): TPlugin[] {
    // Filter by plugin type first, then apply feature-flag visibility.
    const values = [...this.plugins.values()];
    const filtered = kind ? values.filter((p) => p.kind === kind) : values;
    return filtered.filter((plugin) => {
      if (!plugin.featureFlag) {
        return true;
      }
      return this.flags.get(plugin.featureFlag) !== false;
    });
  }
}
