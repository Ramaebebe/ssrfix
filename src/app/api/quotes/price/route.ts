import { NextRequest, NextResponse } from "next/server";
import { getRouteSupabase } from "@/lib/supabase/server";
import { priceQuote } from "@/lib/quoteEngine";

export async function POST(req: NextRequest){
  const body = await req.json();
  const sb = getRouteSupabase();

  if (body.action === "catalog") {
    const { data: vehicles } = await sb.from("portal.vehicles").select("*").order("make");
    const { data: accessories } = await sb.from("portal.accessories").select("*").order("label");
    return NextResponse.json({ vehicles: vehicles||[], accessories: accessories||[] });
  }

  const { vehicleId, termMonths, limitKm, accessories } = body;
  const { data: vehicle, error: vErr } = await sb.from("portal.vehicles").select("*").eq("id", vehicleId).single();
  if (vErr || !vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

  const { data: accs } = await sb.from("portal.accessories").select("*").in("id", accessories||[]);
  const result = priceQuote({ vehicle, termMonths, limitKm, accessories: accs||[] });

  // store quote
  const { data: session } = await sb.auth.getSession();
  const user = session.session?.user;
  const { data: prof } = await sb.from("portal.profiles").select("*").eq("user_id", user?.id ?? "").maybeSingle();
  const org_id = prof?.org_id || null;

  const { data: saved, error } = await sb.from("portal.quotes").insert({
    org_id, user_id: user?.id ?? "00000000-0000-0000-0000-000000000000",
    vehicle_id: vehicleId, term_months: termMonths, limit_km: limitKm,
    accessories: (accs||[]).map(a=>a.id), monthly: result.monthly, total: result.total
  }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ...result, quoteId: saved.id });
}
