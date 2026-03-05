import { describe, expect, it } from "vitest";
import { createParseStage } from "./parse";
import type { PipelineContext } from "../types";

function createContext(text: string, title = "Report"): PipelineContext {
  return {
    rssItems: [
      {
        sourceId: "src-1",
        sourceName: "source",
        url: "https://example.com/item",
        publishedAt: "2026-03-05T00:00:00.000Z",
        title,
        text
      }
    ],
    parsed: [],
    normalized: [],
    deduped: [],
    scored: []
  };
}

describe("createParseStage", () => {
  it("classifies intercept events and applies location hints", async () => {
    const stage = createParseStage();
    const ctx = createContext("Iran intercept over Tehran");

    const next = await stage.run(ctx);
    const parsed = next.parsed[0];
    expect(parsed).toBeDefined();
    if (!parsed) {
      throw new Error("Expected parsed output");
    }

    // Tehran mention should map to the predefined Tehran hint coordinates.
    expect(next.parsed).toHaveLength(1);
    expect(parsed.eventType).toBe("intercept");
    expect(parsed.lon).toBe(51.389);
    expect(parsed.lat).toBe(35.6892);
  });

  it("falls back to Iran theater center when no hint is present", async () => {
    const stage = createParseStage();
    const ctx = createContext("Iran strike reported without city");

    const next = await stage.run(ctx);
    const parsed = next.parsed[0];
    expect(parsed).toBeDefined();
    if (!parsed) {
      throw new Error("Expected parsed output");
    }

    // Unknown locations still get a deterministic fallback to keep map rendering stable.
    expect(parsed.eventType).toBe("strike");
    expect(parsed.lon).toBe(53.688);
    expect(parsed.lat).toBe(32.4279);
  });
});
