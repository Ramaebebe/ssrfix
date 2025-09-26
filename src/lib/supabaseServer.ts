/**
 * Server-side Supabase client for Next.js App Router (Node/Edge).
 * Uses @supabase/ssr cookie adapter to keep session across SSR/Server Actions.
 *
 * Env required:
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - NEXT_PUBLIC_SUPABASE_ANON_KEY  (do NOT use service role in frontend)
 */
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export function getSupabaseServerClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error('Supabase env not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Edge runtime may not allow setting during rendering; ignore.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        } catch {
          // Edge runtime may not allow removing during rendering; ignore.
        }
      },
    },
    global: {
      headers: {
        'x-client-info': 'portal2509-ssrfix2/server',
      },
    },
  });
}

export default getSupabaseServerClient;
