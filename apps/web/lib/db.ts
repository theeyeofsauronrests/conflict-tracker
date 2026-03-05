import { Pool, type PoolConfig } from "pg";
import { getDbEnv } from "./env";

type GlobalWithPool = typeof globalThis & {
  __conflictTrackerPool?: Pool;
};

function getPoolConfig(): PoolConfig {
  const env = getDbEnv();
  if (env.DATABASE_URL) {
    // One URL keeps cloud and local wiring consistent for app/runtime scripts.
    return { connectionString: env.DATABASE_URL };
  }

  return {
    host: env.PGHOST,
    port: env.PGPORT,
    database: env.PGDATABASE,
    user: env.PGUSER,
    password: env.PGPASSWORD
  };
}

export function getDbPool(): Pool {
  const globalRef = globalThis as GlobalWithPool;
  if (!globalRef.__conflictTrackerPool) {
    // Reuse one pool in dev hot-reload so we do not leak DB connections.
    globalRef.__conflictTrackerPool = new Pool(getPoolConfig());
  }
  return globalRef.__conflictTrackerPool;
}
