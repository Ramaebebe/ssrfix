"use client";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

let _client: ReturnType<typeof createClient<Database>> | null = null;

export function getBrowserSupabase() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  _client = createClient<Database>(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  return _client;
}

export const supabase = getBrowserSupabase();
export default getBrowserSupabase;
