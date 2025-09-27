import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
// import type { Database } from "@/types/supabase";

export function getServerSupabase() {
  return createServerComponentClient/*<Database>*/({ cookies });
}

export default getServerSupabase;
