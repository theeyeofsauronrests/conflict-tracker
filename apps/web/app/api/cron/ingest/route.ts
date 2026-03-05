import { runCronIngest } from "./handler";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  // Keep the route itself tiny so the behavior lives in a testable handler.
  return runCronIngest(request);
}
