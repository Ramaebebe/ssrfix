import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildAuditPdf } from "@/lib/pdf/auditTemplate";
import { BRAND } from "@/lib/pdf/brand";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // Fetch inspection + photos from your tables
    const { data: audit, error } = await supabase
      .from("vehicle_audits")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !audit) throw new Error("Audit not found");

    const { data: photosList } = await supabase
      .from("vehicle_audit_photos")
      .select("path, filename")
      .eq("audit_id", id);

    const photos: { filename: string; bytes: Uint8Array }[] = [];
    if (photosList?.length) {
      for (const p of photosList) {
        const { data: file } = await supabase.storage.from("audit-photos").download(p.path);
        if (file) {
          const arr = new Uint8Array(await file.arrayBuffer());
          photos.push({ filename: p.filename || p.path.split("/").pop() || "photo", bytes: arr });
        }
      }
    }

    const logoPath = path.join(process.cwd(), "public", BRAND.logoPath.replace(/^\//, ""));
    const logoBytes = await fs.readFile(logoPath).catch(() => new Uint8Array());

    const pdfBytes = await buildAuditPdf({
      id: audit.id,
      date: audit.date || new Date().toISOString(),
      inspector: audit.inspector || "N/A",
      vehicle: { reg: audit.reg, vin: audit.vin, make: audit.make, model: audit.model },
      location: { lat: audit.lat || 0, lng: audit.lng || 0, address: audit.address || "" },
      findings: (audit.findings || []).map((f: any) => ({ label: f.label, value: f.value })),
      notes: audit.notes || "",
      photos,
    }, logoBytes as unknown as Uint8Array);

    const filename = `audit-${id}.pdf`;
    const disp = req.nextUrl.searchParams.get("download") === "1"
      ? `attachment; filename="${filename}"`
      : `inline; filename="${filename}"`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disp,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Failed to render audit PDF" }, { status: 400 });
  }
}
