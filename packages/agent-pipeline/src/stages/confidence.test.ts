import { describe, expect, it } from "vitest";
import type { PipelineContext } from "../types";
import { confidenceStage } from "./confidence";

function createContext(title: string, text: string): PipelineContext {
  return {
    rssItems: [],
    parsed: [],
    normalized: [],
    deduped: [
      {
        rss: {
          sourceId: "src-1",
          sourceName: "source",
          url: "https://example.com/item",
          publishedAt: "2026-03-05T00:00:00.000Z",
          title,
          text
        },
        eventType: "strike",
        eventTime: "2026-03-05T00:00:00.000Z",
        rawText: text,
        lon: 33.3823,
        lat: 35.1856
      }
    ],
    scored: []
  };
}

describe("confidenceStage", () => {
  it("downgrades confidence when attribution is explicitly negated", async () => {
    const uncertain = await confidenceStage.run(
      createContext(
        "UK says drone attack on Cyprus base was not launched from Iran",
        "Attack on Cyprus base was not launched from Iran"
      )
    );
    const corroborated = await confidenceStage.run(
      createContext("Confirmed strike video released", "Confirmed strike with video and satellite imagery")
    );

    expect(uncertain.scored[0]?.confidence).toBeLessThan(0.5);
    expect(corroborated.scored[0]?.confidence).toBeGreaterThan(0.7);
  });
});
