"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../types"; // optional: your generated types

export const supabase = createClientComponentClient<Database>();