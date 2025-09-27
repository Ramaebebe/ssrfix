'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let _client: SupabaseClient | null = null;
export function getSupabaseBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error('Supabase env not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  if (_client) return _client;
  _client = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    global: { headers: { 'x-client-info': 'portal2509-ssrfix2/browser' } },
  });
  return _client;
}
export default getSupabaseBrowserClient;
