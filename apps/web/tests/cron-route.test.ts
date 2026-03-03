import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/ingest", () => ({
  runIngestion: vi.fn(async () => 3)
}));

import { runCronIngest } from "@/app/api/cron/ingest/handler";
import { runIngestion } from "@/lib/ingest";

describe("runCronIngest", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "secret";
  });

  it("returns 401 when cron secret is invalid", async () => {
    const request = new Request("http://localhost/api/cron/ingest", {
      headers: { "x-cron-secret": "wrong" }
    });

    const response = await runCronIngest(request);
    expect(response.status).toBe(401);
  });

  it("runs ingestion when secret is valid", async () => {
    const request = new Request("http://localhost/api/cron/ingest", {
      headers: { "x-cron-secret": "secret" }
    });

    const response = await runCronIngest(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.inserted).toBe(3);
    expect(runIngestion).toHaveBeenCalledTimes(1);
  });
});
