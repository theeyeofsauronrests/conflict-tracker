import { afterEach, describe, expect, it, vi } from "vitest";
import { createIranConflictRssPlugin, runIngestPlugins, type IngestPlugin } from "./index";

describe("createIranConflictRssPlugin", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("keeps only recent Iran strike/intercept items", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T12:00:00Z"));

    const xml = `<?xml version="1.0"?><rss><channel>
      <item>
        <title>Iran strike reported near Tehran</title>
        <link>https://example.com/iran-strike</link>
        <pubDate>Wed, 04 Mar 2026 10:00:00 GMT</pubDate>
        <description>Missile strike details</description>
      </item>
      <item>
        <title>Regional trade update</title>
        <link>https://example.com/trade</link>
        <pubDate>Wed, 04 Mar 2026 09:00:00 GMT</pubDate>
        <description>No military event</description>
      </item>
      <item>
        <title>Iran intercept report</title>
        <link>https://example.com/iran-intercept</link>
        <pubDate>Fri, 27 Feb 2026 09:00:00 GMT</pubDate>
        <description>Outside lookback window</description>
      </item>
    </channel></rss>`;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(xml, {
          status: 200,
          headers: { "content-type": "application/rss+xml" }
        })
      )
    );

    const plugin = createIranConflictRssPlugin({ id: "iran-test", lookbackDays: 4 });
    // Only the first item is both Iran-conflict related and inside the lookback window.
    const items = await plugin.run();
    const item = items[0];
    expect(item).toBeDefined();
    if (!item) {
      throw new Error("Expected at least one filtered item");
    }

    expect(items).toHaveLength(1);
    expect(item.title).toContain("Iran strike");
  });
});

describe("runIngestPlugins", () => {
  it("continues when one plugin fails", async () => {
    const okPlugin: IngestPlugin = {
      id: "ok",
      kind: "ingest",
      description: "ok",
      run: async () => [
        {
          sourceId: "ok",
          sourceName: "ok",
          url: "https://example.com/ok",
          publishedAt: "2026-03-05T00:00:00.000Z",
          title: "ok",
          text: "ok"
        }
      ]
    };

    const badPlugin: IngestPlugin = {
      id: "bad",
      kind: "ingest",
      description: "bad",
      run: async () => {
        throw new Error("boom");
      }
    };

    // Failure isolation is critical so one bad source does not block all ingestion.
    const merged = await runIngestPlugins([okPlugin, badPlugin]);
    const first = merged[0];
    expect(first).toBeDefined();
    if (!first) {
      throw new Error("Expected merged plugin output");
    }
    expect(merged).toHaveLength(1);
    expect(first.sourceId).toBe("ok");
  });
});
