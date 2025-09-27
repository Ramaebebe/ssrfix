import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createRouteHandlerClient
} from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/** Use inside Server Components (respects user session via cookies) */
export function getServerSupabase() {
  return createServerComponentClient<Database>({ cookies });
}

/** Use inside Route Handlers (/app/api/*) when you need the user session */
export function getRouteSupabase() {
  return createRouteHandlerClient<Database>({ cookies });
}

/** Use inside Route Handlers for privileged ops (service role) */
export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key);
}
