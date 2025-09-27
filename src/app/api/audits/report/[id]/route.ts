// C:\Users\TebohoRamaebebe\OneDrive - Afrirent PTY Ltd\Documents\GitHub\portal2509-ssrfix2\src\app\api\audits\report\[id]\route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildAuditPdf } from "@/lib/pdf/auditTemplate";
import { BRAND } from "@/lib/pdf/brand";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // <-- needed since we use fs/path (Node APIs)

type PhotoBlob = { filename: string; bytes: Uint8Array };

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1) Load audit row
    const { data: audit, error } = await supabase
      .from("vehicle_audits")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !audit) {
      throw new Error("Audit not found");
    }

    // 2) Load photo paths
    const { data: photosList, error: photosErr } = await supabase
      .from("vehicle_audit_photos")
      .select("path, filename")
      .eq("audit_id", id);

    if (photosErr) {
      throw new Error(photosErr.message);
    }

    // 3) Download photos from Storage
    const photos: PhotoBlob[] = [];
    if (photosList?.length) {
      for (const p of photosList) {
        const { data: file, error: dlErr } = await supabase.storage
          .from("audit-photos")
          .download(p.path);
        if (!dlErr && file) {
          const arr = new Uint8Array(await file.arrayBuffer());
          photos.push({
            filename: p.filename || p.path.split("/").pop() || "photo",
            bytes: arr,
          });
        }
      }
    }

    // 4) Load logo bytes (optional)
    const logoPath = path.join(process.cwd(), "public", BRAND.logoPath.replace(/^\//, ""));
    const logoBytes =
      (await fs
        .readFile(logoPath)
        .catch(() => undefined)) || new Uint8Array();

    // 5) Normalize fields for the PDF template

    // lat/lng: treat 0 as valid; only fallback when null/undefined
    const hasLat = audit.lat !== null && audit.lat !== undefined;
    const hasLng = audit.lng !== null && audit.lng !== undefined;
    const locStr =
      hasLat && hasLng
        ? `${audit.lat}, ${audit.lng}${audit.address ? " — " + audit.address : ""}`
        : (audit.address || "N/A");

    // findings: ensure array of {label, value} strings
    const findings: Array<{ label: string; value: string }> = Array.isArray(audit.findings)
      ? audit.findings.map((f: any) => ({
          label: String(f?.label ?? ""),
          value: String(f?.value ?? ""),
        }))
      : typeof audit.findings === "string"
      ? [{ label: "Notes", value: audit.findings }]
      : [];

    // 6) Build the PDF
    const pdfBytes = await buildAuditPdf(
      {
        id: audit.id,
        date: audit.date || new Date().toISOString(),
        inspector: audit.inspector || "N/A",
        vehicle: {
          reg: audit.reg || "",
          vin: audit.vin || "",
          make: audit.make || "",
          model: audit.model || "",
        },
        location: locStr, // <- string, fixes your original type error
        findings,
        notes: audit.notes || "",
        photos,
      },
      logoBytes as Uint8Array
    );

    // 7) Stream back as inline or attachment
    const filename = `audit-${id}.pdf`;
    const disp =
      req.nextUrl.searchParams.get("download") === "1"
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
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to render audit PDF" },
      { status: 400 }
    );
  }
}
