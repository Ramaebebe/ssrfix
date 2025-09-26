// Optional: Only if you need server components with session-aware queries
"use server";

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../types";

export function getServerSupabase() {
  return createServerComponentClient<Database>({ cookies });
}
