import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns a singleton Supabase client when env vars exist.
 * If NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are missing,
 * returns null instead of throwing during prerender/build.
 */
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return null;
  }
  if (_client) return _client;
  _client = createClient(url, anon);
  return _client;
}

/**
 * Default export for convenience. Note it can be null when envs are not set.
 * Prefer calling getSupabaseClient() in code that may run during build/prerender.
 */
const supabase = getSupabaseClient();
export default supabase;

// Optional named export for code that previously did `import { supabase }`
export { supabase };
