"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// If you have a generated Database type, import it here
// import type { Database } from "@/types/supabase";

export const supabase = createClientComponentClient/*<Database>*/();
export default supabase;
