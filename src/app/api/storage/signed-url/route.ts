import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { bucket, path, expiresIn = 120 } = await req.json();
    if (!bucket || !path) throw new Error("bucket and path required");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    if (error) throw error;
    return NextResponse.json({ url: data.signedUrl }, { status: 200 });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Failed to create signed URL" }, { status: 400 });
  }
}

