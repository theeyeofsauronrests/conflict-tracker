import type { Event, RssItem } from "@conflict-tracker/data-model";
import type { AgentStage } from "./types";
export declare function createDefaultStages(openaiApiKey?: string): AgentStage[];
export declare function runAgentPipeline(items: RssItem[], stages: AgentStage[]): Promise<Event[]>;
//# sourceMappingURL=index.d.ts.map