export type FeatureFlag = "rssIngest" | "agentPipeline" | "heatmapLayer" | "densityLayer";
export type PluginKind = "ingest" | "agent" | "map";
export interface PluginContract<TConfig = unknown> {
    id: string;
    kind: PluginKind;
    featureFlag?: FeatureFlag;
    description: string;
    configSchema?: TConfig;
}
export declare class PluginRegistry<TPlugin extends PluginContract> {
    private readonly plugins;
    private readonly flags;
    register(plugin: TPlugin): void;
    setFeatureFlag(flag: FeatureFlag, enabled: boolean): void;
    list(kind?: PluginKind): TPlugin[];
}
//# sourceMappingURL=index.d.ts.map