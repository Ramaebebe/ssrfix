// src/app/client/wcp/assessments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

type ChecklistItem = {
  category: string;
  field: string;
  status: "pass" | "fail" | "na";
  notes?: string;
  media_url?: string | null;
};

type PostBody = {
  vehicle: { id: string };
  checklist?: ChecklistItem[];
  signature?: string;
};

export async function POST(req: NextRequest) {
  const supabase = getServerSupabase();
  const body: PostBody = await req.json();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("wcp_assessments")
    .insert({
      vehicle_id: body.vehicle.id,
      operator_id: user.id,
      signature_url: body.signature ?? null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (body.checklist?.length) {
    const items = body.checklist.map((i) => ({
      assessment_id: data.id,
      category: i.category,
      field: i.field,
      status: i.status,
      notes: i.notes ?? null,
      media_url: i.media_url ?? null,
    }));

    const { error: itemsError } = await supabase.from("wcp_assessment_items").insert(items);
    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
