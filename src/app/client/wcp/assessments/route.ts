import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  const sb = getSupabaseClient();
  const body = await req.json();

  const { data, error } = await sb.from("wcp_assessments")
    .insert({ vehicle_id: body.vehicle.id, operator_id: sb.auth.getUser(), signature_url: body.signature })
    .select("*").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (body.checklist?.length) {
    await sb.from("wcp_assessment_items").insert(
      body.checklist.map((i: any) => ({ ...i, assessment_id: data.id }))
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
