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

  it("infers actor and target from common intercept phrasing", async () => {
    const stage = createParseStage();
    const ctx = createContext("Israel intercepts Iranian missile over Iraq");

    const next = await stage.run(ctx);
    const parsed = next.parsed[0];
    expect(parsed).toBeDefined();
    if (!parsed) {
      throw new Error("Expected parsed output");
    }

    expect(parsed.eventType).toBe("intercept");
    expect(parsed.actorNationality).toBe("israel");
    expect(parsed.targetNationality).toBe("iran");
  });

  it("maps non-Iran theaters when the text mentions them", async () => {
    const stage = createParseStage();
    const ctx = createContext("Strike report near Beirut in Lebanon");

    const next = await stage.run(ctx);
    const parsed = next.parsed[0];
    expect(parsed).toBeDefined();
    if (!parsed) {
      throw new Error("Expected parsed output");
    }

    expect(parsed.lon).toBe(35.5018);
    expect(parsed.lat).toBe(33.8938);
  });

  it("uses location theater as target when only one actor mention exists", async () => {
    const stage = createParseStage();
    const ctx = createContext("Iran launches missiles in Iraq");

    const next = await stage.run(ctx);
    const parsed = next.parsed[0];
    expect(parsed).toBeDefined();
    if (!parsed) {
      throw new Error("Expected parsed output");
    }

    expect(parsed.actorNationality).toBe("iran");
    expect(parsed.targetNationality).toBe("iraq");
  });

  it("treats location phrasing as target and avoids negated actor attribution", async () => {
    const stage = createParseStage();
    const ctx = createContext(
      "UK says drone attack on Cyprus base was not launched from Iran",
      "UK says drone attack on Cyprus base was not launched from Iran"
    );

    const next = await stage.run(ctx);
    const parsed = next.parsed[0];
    expect(parsed).toBeDefined();
    if (!parsed) {
      throw new Error("Expected parsed output");
    }

    expect(parsed.targetNationality).toBe("cyprus");
    expect(parsed.actorNationality).toBeUndefined();
  });
});
