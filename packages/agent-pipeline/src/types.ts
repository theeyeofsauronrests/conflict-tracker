import type { Event, RssItem } from "@conflict-tracker/data-model";

export interface ParsedSignal {
  rss: RssItem;
  eventType: "strike" | "intercept";
  eventTime: string;
  rawText: string;
  lon: number;
  lat: number;
  actorNationality?: string;
  targetNationality?: string;
}

export interface PipelineContext {
  rssItems: RssItem[];
  parsed: ParsedSignal[];
  normalized: ParsedSignal[];
  deduped: ParsedSignal[];
  scored: Event[];
}

export interface AgentStage {
  id: string;
  run: (ctx: PipelineContext) => Promise<PipelineContext>;
}
