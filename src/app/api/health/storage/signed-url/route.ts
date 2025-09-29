import { NextRequest, NextResponse } from "next/server";
import { getRouteSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest){
  const { bucket, path, expires } = await req.json();
  const sb = getRouteSupabase();
  const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, expires ?? 3600);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ signedUrl: data.signedUrl });
}
