// src/app/api/audits/report/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildWcpAuditPdf, type WcpAuditPdfData } from "@/lib/pdf/wcpAuditTemplate";
import { toUint8 } from "@/lib/pdf/binary";

export const dynamic = "force-dynamic";

type RowVehicle = {
  reg: string | null;
  vin: string | null;
  make: string | null;
  model: string | null;
};

type RowItem = {
  category: string;
  field: string;
  status: string;
  notes: string | null;
};

type RowAssessment = {
  id: string;
  created_at: string;
  operator_id: string | null;
  signature_url: string | null;
  vehicle: RowVehicle | null;
  items: RowItem[] | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const sb = createClient(supabaseUrl, serviceKey);

  const { data, error } = await sb
    .from("wcp_assessments")
    .select<RowAssessment>(
      `
      id, created_at, operator_id, signature_url,
      vehicle:vehicles ( reg, vin, make, model ),
      items:wcp_assessment_items ( category, field, status, notes )
    `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Not found" }, { status: 404 });
  }

  const payload: WcpAuditPdfData = {
    assessment: {
      id: data.id,
      createdAt: data.created_at,
      operatorId: data.operator_id ?? undefined,
      signatureUrl: data.signature_url ?? undefined,
    },
    vehicle: {
      reg: data.vehicle?.reg ?? "-",
      vin: data.vehicle?.vin ?? "-",
      make: data.vehicle?.make ?? "-",
      model: data.vehicle?.model ?? "-",
    },
    items:
      (data.items ?? []).map((i) => ({
        category: i.category,
        field: i.field,
        status: i.status as "Pass" | "Fail" | "N/A",
        notes: i.notes ?? undefined,
      })) ?? [],
  };

  const pdfBytes = await buildWcpAuditPdf(payload);
  const u8 = toUint8(pdfBytes);

  return new NextResponse(new Blob([u8], { type: "application/pdf" }), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="audit-${id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
