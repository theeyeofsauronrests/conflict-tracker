import { createParseStage } from "./stages/parse";
import { geoNormalizeStage } from "./stages/geo-normalize";
import { dedupeStage } from "./stages/dedupe";
import { confidenceStage } from "./stages/confidence";
export function createDefaultStages() {
    // The order matters: parse -> clean location -> remove duplicates -> score trust.
    return [createParseStage(), geoNormalizeStage, dedupeStage, confidenceStage];
}
export async function runAgentPipeline(items, stages) {
    // Context carries state forward from one stage to the next.
    let ctx = {
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
