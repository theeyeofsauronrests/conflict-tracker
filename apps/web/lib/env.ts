import { z } from "zod";

const dbEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  PGHOST: z.string().default("localhost"),
  PGPORT: z.coerce.number().int().positive().default(54322),
  PGDATABASE: z.string().default("conflict_tracker"),
  PGUSER: z.string().default("postgres"),
  PGPASSWORD: z.string().default("postgres")
});

const cronEnvSchema = z.object({
  CRON_SECRET: z.string().min(1)
});

export function getDbEnv() {
  // Validate once so local dev defaults are always predictable.
  return dbEnvSchema.parse(process.env);
}

export function getCronEnv() {
  // Cron path only needs one shared secret for trusted triggers.
  return cronEnvSchema.parse(process.env);
}
