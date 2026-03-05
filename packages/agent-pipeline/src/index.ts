import type { Event, RssItem } from "@conflict-tracker/data-model";
import { createParseStage } from "./stages/parse";
import { geoNormalizeStage } from "./stages/geo-normalize";
import { dedupeStage } from "./stages/dedupe";
import { confidenceStage } from "./stages/confidence";
import type { AgentStage, PipelineContext } from "./types";

export function createDefaultStages(): AgentStage[] {
  // The order matters: parse -> clean location -> remove duplicates -> score trust.
  return [createParseStage(), geoNormalizeStage, dedupeStage, confidenceStage];
}

export async function runAgentPipeline(items: RssItem[], stages: AgentStage[]): Promise<Event[]> {
  // Context carries state forward from one stage to the next.
  let ctx: PipelineContext = {
    rssItems: items,
    parsed: [],
    normalized: [],
    deduped: [],
    scored: []
  };

  for (const stage of stages) {
    // Each stage updates context in place and hands it to the next step.
    ctx = await stage.run(ctx);
  }

  return ctx.scored;
}
