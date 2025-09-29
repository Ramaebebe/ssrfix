import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildAuditPdf } from "@/lib/pdf/auditTemplate";
import { BRAND } from "@/lib/pdf/brand";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const toUint8 = (buf: Buffer): Uint8Array =>
  new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: audit } = await supabase.from("vehicle_audits").select("*").eq("id", params.id).single();
    if (!audit) throw new Error("Audit not found");

    const logoPath = path.join(process.cwd(), "public", BRAND.logoPath.replace(/^\//, ""));
    const logoBuf = await fs.readFile(logoPath).catch(() => Buffer.alloc(0));
    const logoBytes = toUint8(logoBuf);

    const pdfBytes = await buildAuditPdf(
      {
        id: audit.id,
        date: audit.date || new Date().toISOString(),
        inspector: audit.inspector || "N/A",
        vehicle: { reg: audit.reg, vin: audit.vin, make: audit.make, model: audit.model },
        location: audit.address || "N/A",
        findings: audit.findings || "None",
        notes: audit.notes || "",
        photos: [],
      },
      logoBytes
    );

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    return new NextResponse(blob, {
      status: 200,
      headers: { "Content-Disposition": `inline; filename="audit-${params.id}.pdf"` },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to render audit PDF" },
      { status: 400 }
    );
  }
}