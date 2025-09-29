"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// import type { Database } from "@/types/supabase"; // optional

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // This throws during render if you forgot the env vars – helpful in dev.
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Set them in .env.local and restart the dev server."
  );
}

export const supabase = createClientComponentClient/*<Database>*/();
export default supabase;
