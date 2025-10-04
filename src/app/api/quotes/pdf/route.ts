// src/app/api/quotes/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildQuotePdf } from "@/lib/pdf/quoteTemplate";
import { toUint8 } from "@/lib/pdf/binary";

// Make route dynamic to ensure server execution
export const dynamic = "force-dynamic";

type RowVehicle = {
  reg: string | null;
  vin: string | null;
  make: string | null;
  model: string | null;
  base_price: number | null;
};

type RowAccessory = {
  id: string;
  name: string;
  price: number | null;
};

type RowQuote = {
  id: string;
  created_at: string;
  customer_name: string | null;
  salesperson: string | null;
  rate_pa: number | null;
  term_months: number | null;
  vehicle_id: string | null;
  accessories: string[] | null; // array of accessory ids
};

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const bucket = process.env.STORAGE_BUCKET_QUOTES || "quotes";

  const sb = createClient(supabaseUrl, serviceKey);

  // Accept either { quoteId } or a full payload for ad-hoc PDF
  type Body =
    | { quoteId: string }
    | {
        quote: Partial<RowQuote>;
        vehicle: Partial<RowVehicle>;
        accessories?: Partial<RowAccessory>[];
      };

  const body: Body = await req.json();

  // If quoteId provided, assemble from DB
  if ("quoteId" in body) {
    const quoteId = body.quoteId;

    const { data: q, error: qErr } = await sb
      .from("quotes")
      .select<RowQuote>("id, created_at, customer_name, salesperson, rate_pa, term_months, vehicle_id, accessories")
      .eq("id", quoteId)
      .single();

    if (qErr || !q) {
      return NextResponse.json({ error: qErr?.message || "Quote not found" }, { status: 404 });
    }

    const { data: vehicle, error: vErr } = await sb
      .from("vehicles")
      .select<RowVehicle>("reg, vin, make, model, base_price")
      .eq("id", q.vehicle_id)
      .single();

    if (vErr || !vehicle) {
      return NextResponse.json({ error: vErr?.message || "Vehicle not found" }, { status: 404 });
    }

    let accRows: RowAccessory[] = [];
    if (q.accessories && q.accessories.length) {
      const { data: accs } = await sb
        .from("accessories")
        .select<RowAccessory>("id, name, price")
        .in("id", q.accessories);
      accRows = accs ?? [];
    }

    // Build PDF from assembled data
    const pdfBytes = await buildQuotePdf({
      quote: {
        id: q.id,
        createdAt: q.created_at,
        customerName: q.customer_name ?? "-",
        salesperson: q.salesperson ?? "-",
        ratePerAnnum: q.rate_pa ?? 0,
        termMonths: q.term_months ?? 0,
      },
      vehicle: {
        reg: vehicle.reg ?? "-",
        vin: vehicle.vin ?? "-",
        make: vehicle.make ?? "-",
        model: vehicle.model ?? "-",
        basePrice: vehicle.base_price ?? 0,
      },
      accessories: accRows.map((a) => ({
        id: a.id,
        name: a.name,
        price: a.price ?? 0,
      })),
    });

    const u8 = toUint8(pdfBytes);

    // Store + return a signed URL (so UI can download immediately)
    const path = `quotes/${q.id}.pdf`;
    const _up = await sb.storage.from(bucket).upload(path, u8, {
      upsert: true,
      contentType: "application/pdf",
    });

    // Get a short-lived signed URL (fallback to public URL if bucket is public)
    const { data: signed } = await sb.storage.from(bucket).createSignedUrl(path, 60 * 10);
    const url = signed?.signedUrl ?? sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;

    return NextResponse.json({ id: q.id, url }, { status: 201 });
  }

  // Otherwise: accept an ad-hoc payload (no DB lookups). Strictly typed via Partial rows.
  const payload = body as Extract<Body, { quote: Partial<RowQuote>; vehicle: Partial<RowVehicle>; accessories?: Partial<RowAccessory>[] }>;

  const pdfBytes = await buildQuotePdf({
    quote: {
      id: payload.quote.id ?? "adhoc",
      createdAt: payload.quote.created_at ?? new Date().toISOString(),
      customerName: payload.quote.customer_name ?? "-",
      salesperson: payload.quote.salesperson ?? "-",
      ratePerAnnum: payload.quote.rate_pa ?? 0,
      termMonths: payload.quote.term_months ?? 0,
    },
    vehicle: {
      reg: payload.vehicle.reg ?? "-",
      vin: payload.vehicle.vin ?? "-",
      make: payload.vehicle.make ?? "-",
      model: payload.vehicle.model ?? "-",
      basePrice: payload.vehicle.base_price ?? 0,
    },
    accessories:
      (payload.accessories ?? []).map((a) => ({
        id: a.id ?? "",
        name: a.name ?? "",
        price: a.price ?? 0,
      })) ?? [],
  });

  const u8 = toUint8(pdfBytes);
  return new NextResponse(new Blob([u8], { type: "application/pdf" }), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="quote.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
