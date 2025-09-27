import { NextResponse } from "next/server";
import getServerSupabase from "@/lib/supabase/server";

export async function GET() {
  const supabase = getServerSupabase();
  // … your logic
  return NextResponse.json({ ok: true });
}
