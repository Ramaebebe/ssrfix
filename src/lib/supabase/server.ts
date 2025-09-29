import { cookies } from "next/headers";
import { createServerComponentClient, createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export function getServerSupabase() {
  const c = cookies();
  if (process.env.NODE_ENV !== "production" && !c.get("supabase-auth-token")) {
    console.warn("⚠️ No Supabase session cookie. If this is dev, sign in first.");
  }
  return createServerComponentClient({ cookies });
}

export function getRouteSupabase() {
  return createRouteHandlerClient({ cookies });
}

export default getServerSupabase;
