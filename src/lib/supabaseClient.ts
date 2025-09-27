// src/lib/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/** Returns a singleton browser Supabase client (anon key). */
export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! ||
    process.env.SUPABASE_SERVICE_ROLE_KEY!; // fallback if set locally
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  _client = createClient(url, key);
  return _client;
}

/** Convenience export for modules that import { supabase } */
export const supabase = getSupabaseClient();

/** Default export so modules can `import getSupabaseClient from ...` */
export default getSupabaseClient;

