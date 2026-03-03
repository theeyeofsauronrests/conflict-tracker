import { z } from "zod";

// Split env validation by use-case so each caller asks only for what it needs.
const supabaseEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1)
});

const cronEnvSchema = z.object({
  CRON_SECRET: z.string().min(1),
  OPENAI_API_KEY: z.string().optional()
});

export function getSupabaseEnv() {
  // Fail fast at startup if required database settings are missing.
  return supabaseEnvSchema.parse(process.env);
}

export function getCronEnv() {
  // Cron path has its own minimal secret requirements.
  return cronEnvSchema.parse(process.env);
}
