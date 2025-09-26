import { createClient } from "@supabase/supabase-js";

// Server-side client using the service role for DB writes from API routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!serviceKey) console.warn("[supabaseServer] Missing SUPABASE_SERVICE_ROLE_KEY – POST routes will fail");

export function getServiceClient() {
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}
