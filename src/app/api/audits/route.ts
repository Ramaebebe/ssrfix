import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vehicleReg, notes, lat, lng, photoPaths = [], tenant_id, user_id } = body || {};

    if (!vehicleReg) return NextResponse.json({ error: "vehicleReg required" }, { status: 400 });

    const supa = getServiceClient();

    // Resolve vehicle by reg (create if missing for tenant)
    let { data: v } = await supa
      .from("vehicles")
      .select("id")
      .eq("tenant_id", tenant_id)
      .eq("reg", vehicleReg)
      .maybeSingle();

    if (!v) {
      const ins = await supa
        .from("vehicles")
        .insert({ tenant_id, reg: vehicleReg })
        .select("id")
        .single();
      if (ins.error) throw ins.error;
      v = ins.data;
    }

    const auditIns = await supa
      .from("vehicle_audits")
      .insert({
        tenant_id,
        vehicle_id: v.id,
        inspected_by: user_id,
        lat, lng,
        notes,
        condition_score: null,
      })
      .select("id")
      .single();

    if (auditIns.error) throw auditIns.error;
    const auditId = auditIns.data.id;

    if (Array.isArray(photoPaths) && photoPaths.length) {
      const rows = photoPaths.map((p: string) => ({ audit_id: auditId, storage_path: p }));
      const photosIns = await supa.from("vehicle_audit_photos").insert(rows);
      if (photosIns.error) throw photosIns.error;
    }

    return NextResponse.json({ id: auditId });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Unexpected error" }, { status: 500 });
  }
}

