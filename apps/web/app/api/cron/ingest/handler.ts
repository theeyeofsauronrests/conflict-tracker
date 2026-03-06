import { timingSafeEqual } from "node:crypto";
import { runIngestion } from "@/lib/ingest";
import { getCronEnv } from "@/lib/env";

function safeSecretEquals(left: string | null | undefined, right: string): boolean {
  if (!left) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function runCronIngest(request: Request): Promise<Response> {
  // Only trusted cron calls are allowed to trigger writes.
  const { CRON_SECRET } = getCronEnv();
  const requestSecret = request.headers.get("x-cron-secret");
  const authHeader = request.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : null;

  // Accept either explicit secret header or standard Bearer token style.
  const isAuthorized = safeSecretEquals(requestSecret, CRON_SECRET) || safeSecretEquals(bearerSecret, CRON_SECRET);
  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  // Run the full ingest pipeline and report how many events were saved.
  const inserted = await runIngestion();
  return new Response(JSON.stringify({ inserted }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
