import { type RssItem } from "@conflict-tracker/data-model";
import type { PluginContract } from "@conflict-tracker/plugin-registry";
export interface IngestPlugin extends PluginContract {
    kind: "ingest";
    run: () => Promise<RssItem[]>;
}
export interface RssPluginConfig {
    id: string;
    sourceName: string;
    feedUrl: string;
}
export declare function createRssIngestPlugin(config: RssPluginConfig): IngestPlugin;
export declare function runIngestPlugins(plugins: IngestPlugin[]): Promise<RssItem[]>;
//# sourceMappingURL=index.d.ts.map