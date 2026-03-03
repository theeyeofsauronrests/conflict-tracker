import { runCronIngest } from "./handler";

export async function GET(request: Request): Promise<Response> {
  // Keep the route itself tiny so the behavior lives in a testable handler.
  return runCronIngest(request);
}
