import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { buildQuotePdf } from "@/lib/pdf/quoteTemplate";
import { BRAND } from "@/lib/pdf/brand";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const toUint8 = (buf: Buffer): Uint8Array =>
  new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

type QuotePayload = {
  quote: {
    id: string;
    client?: string;
    term?: string;
    totals?: { monthly: number; upfront?: number };
  };
  vehicle: { make: string; model: string; derivative?: string };
  accessories: Array<{ label: string; price: number }>;
};

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body: QuotePayload = await req.json();

    const logoPath = path.join(process.cwd(), "public", BRAND.logoPath.replace(/^\//, ""));
    const logoBuf = await fs.readFile(logoPath).catch(() => Buffer.alloc(0));
    const logoBytes = toUint8(logoBuf);

    const pdfBytes = await buildQuotePdf(
      {
        quoteId: body.quote.id,
        client: body.quote.client || "Client",
        vehicle: body.vehicle,
        term: body.quote.term || "",
        options: body.accessories || [],
        totals: body.quote.totals || { monthly: 0 },
      },
      logoBytes
    );

    const bucket = process.env.STORAGE_BUCKET_QUOTES || "quotes";
    const objectPath = `${body.quote.id}/Afrirent_Quote_${Date.now()}.pdf`;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(objectPath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (upErr) throw upErr;

    const { data: signed, error: urlErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(objectPath, 3600);
    if (urlErr || !signed?.signedUrl) throw new Error("Signed URL creation failed");

    return NextResponse.json({ url: signed.signedUrl }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate PDF" },
      { status: 400 }
    );
  }
}