import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const isConfigured =
  url.startsWith("http://") || url.startsWith("https://");

if (!isConfigured && typeof window === "undefined") {
  console.warn(
    "[zing] Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to enable DB features."
  );
}

/**
 * Returns a configured Supabase client, or null if env vars are missing.
 * All callers must handle the null case — they should return empty data
 * with an appropriate message.
 */
function maybeCreateClient(): SupabaseClient | null {
  if (!isConfigured) return null;
  return createClient(url, key);
}

const _client = maybeCreateClient();

/**
 * Supabase client proxy.
 * When Supabase is not configured, all queries return `{ data: null, error: { message: 'Supabase not configured' }, count: null }`.
 */
export const supabase = _client ?? createNoOpClient();

function createNoOpClient() {
  const noOp = {
    from: () => ({
      select: () => ({
        order:  () => ({ limit: () => Promise.resolve({ data: null, error: { message: "Supabase not configured — set env vars" }, count: null }) }),
        limit:  () => Promise.resolve({ data: null, error: { message: "Supabase not configured — set env vars" }, count: null }),
        eq:     () => ({ order: () => ({ limit: () => Promise.resolve({ data: null, error: null, count: null }) }) }),
      }),
      insert: () => Promise.resolve({ data: null, error: { message: "Supabase not configured — set env vars" } }),
    }),
  };
  return noOp as unknown as SupabaseClient;
}
