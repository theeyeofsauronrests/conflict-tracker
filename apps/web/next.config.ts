import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: [
    "@conflict-tracker/data-model",
    "@conflict-tracker/ingest-plugins",
    "@conflict-tracker/agent-pipeline",
    "@conflict-tracker/map-layers",
    "@conflict-tracker/plugin-registry"
  ],
  typedRoutes: true,
  outputFileTracingRoot: path.resolve(__dirname, "../..")
};

export default nextConfig;
