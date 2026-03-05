import { describe, expect, it, vi, beforeEach } from "vitest";

const listMock = vi.fn();
const registerMock = vi.fn();
const queryMock = vi.fn();

vi.mock("@conflict-tracker/ingest-plugins", () => ({
  createIranConflictRssPlugin: vi.fn(() => ({ id: "iran-plugin", kind: "ingest", description: "iran", run: vi.fn() })),
  runIngestPlugins: vi.fn(async () => [])
}));

vi.mock("@conflict-tracker/agent-pipeline", () => ({
  createDefaultStages: vi.fn(() => []),
  runAgentPipeline: vi.fn(async () => [])
}));

vi.mock("@conflict-tracker/plugin-registry", () => ({
  PluginRegistry: vi.fn(() => ({
    register: registerMock,
    list: listMock
  }))
}));

vi.mock("@/lib/db", () => ({
  getDbPool: vi.fn(() => ({
    query: queryMock
  }))
}));

import { runIngestion } from "@/lib/ingest";
import { runIngestPlugins } from "@conflict-tracker/ingest-plugins";
import { runAgentPipeline } from "@conflict-tracker/agent-pipeline";

describe("runIngestion", () => {
  beforeEach(() => {
    registerMock.mockReset();
    listMock.mockReset().mockReturnValue([{ id: "iran-plugin" }]);
    queryMock.mockReset();
  });

  it("returns 0 without DB writes when pipeline yields no events", async () => {
    vi.mocked(runIngestPlugins).mockResolvedValueOnce([]);
    vi.mocked(runAgentPipeline).mockResolvedValueOnce([]);

    const inserted = await runIngestion();

    // Empty pipeline output should not open any write path to the database.
    expect(inserted).toBe(0);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("counts only truly inserted rows from upsert results", async () => {
    vi.mocked(runIngestPlugins).mockResolvedValueOnce([
      {
        sourceId: "x",
        sourceName: "x",
        url: "https://example.com/x",
        publishedAt: "2026-03-05T00:00:00.000Z",
        title: "x",
        text: "x"
      }
    ]);

    vi.mocked(runAgentPipeline).mockResolvedValueOnce([
      {
        eventType: "strike",
        eventTime: "2026-03-05T01:00:00.000Z",
        confidence: 0.8,
        rawText: "t1",
        dedupeKey: "k1",
        lon: 51,
        lat: 35,
        radiusM: 100,
        sources: [{ url: "https://example.com/1", provider: "p1" }]
      },
      {
        eventType: "intercept",
        eventTime: "2026-03-05T02:00:00.000Z",
        confidence: 0.6,
        rawText: "t2",
        dedupeKey: "k2",
        lon: 52,
        lat: 36,
        radiusM: 120,
        sources: [{ url: "https://example.com/2", provider: "p2" }]
      }
    ]);

    queryMock
      .mockResolvedValueOnce({ rows: [{ inserted: true }] })
      .mockResolvedValueOnce({ rows: [{ inserted: false }] });

    // We count only first-time inserts; updates from ON CONFLICT do not increment.
    const inserted = await runIngestion();
    const firstCall = queryMock.mock.calls[0];
    const secondCall = queryMock.mock.calls[1];
    expect(firstCall).toBeDefined();
    expect(secondCall).toBeDefined();
    if (!firstCall || !secondCall) {
      throw new Error("Expected two DB query calls");
    }

    expect(inserted).toBe(1);
    expect(queryMock).toHaveBeenCalledTimes(2);
    expect(firstCall[1][7]).toBe("k1");
    expect(secondCall[1][7]).toBe("k2");
  });
});
