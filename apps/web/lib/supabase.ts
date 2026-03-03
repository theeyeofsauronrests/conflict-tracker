import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

export function createAnonClient() {
  // Browser-safe client: read-only through RLS and delayed views.
  const env = getSupabaseEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}

export function createServiceClient() {
  // Server-only client for background writes and ingestion tasks.
  const env = getSupabaseEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
}
