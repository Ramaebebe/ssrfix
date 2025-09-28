// src/app/client/wcp/assessments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getRouteSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = getRouteSupabase();
  const body = await req.json();

  // Get the authenticated user from the request
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Insert the parent assessment
  const { data, error } = await supabase
    .from("wcp_assessments")
    .insert({
      vehicle_id: body.vehicle.id,
      operator_id: user.id, // link to authenticated user
      signature_url: body.signature,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Insert checklist items if provided
  if (body.checklist?.length) {
    const items = body.checklist.map((i: any) => ({
      ...i,
      assessment_id: data.id,
    }));

    const { error: itemsError } = await supabase
      .from("wcp_assessment_items")
      .insert(items);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
