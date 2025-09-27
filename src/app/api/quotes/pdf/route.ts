import { NextRequest, NextResponse } from "next/server";
import { getRouteSupabase, getServiceSupabase } from "@/lib/supabase/server";
import { buildQuotePdf } from "@/lib/pdf/quoteTemplate";
import { BRAND } from "@/lib/pdf/brand";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Body:
 * {
 *   entity_id?: string   // optional; fallback to user's default_entity
 *   vehicle_code: string,
 *   term_months: number,
 *   distance_km: number,
 *   accessories: [{ code: string, qty: number }]
 *   customer?: { name?: string; contact?: string }
 * }
 *
 * Response: { quote_id, pdf_signed_url }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vehicle_code, term_months, distance_km, accessories = [], customer } = body as {
      entity_id?: string;
      vehicle_code: string;
      term_months: number;
      distance_km: number;
      accessories: { code: string; qty: number }[];
      customer?: { name?: string; contact?: string };
    };

    // 1) Use user session to resolve entity & permissions
    const sb = getRouteSupabase();
    const userRes = await sb.auth.getUser();
    if (!userRes.data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = userRes.data.user.id;

    let entity_id = body.entity_id as string | undefined;
    if (!entity_id) {
      const { data: profile } = await sb.from("profiles").select("*").eq("user_id", userId).single();
      entity_id = profile?.default_entity ?? null;
      if (!entity_id) return NextResponse.json({ error: "No default entity for user" }, { status: 400 });
    }

    // 2) Fetch catalog
    const [{ data: v, error: vErr }, { data: acc }] = await Promise.all([
      sb.from("vehicles").select("*").eq("entity_id", entity_id).eq("code", vehicle_code).single(),
      sb.from("accessories").select("code, price").eq("entity_id", entity_id)
        .in("code", accessories.map((a: any) => a.code))
    ]);
    if (vErr || !v) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

    // 3) Price engine (same math as /api/quotes/price)
    const accessories_with_price = (accessories || []).map((a: any) => {
      const found = (acc || []).find(x => x.code === a.code);
      return { ...a, price: found ? Number(found.price) : 0 };
    });
    const accessories_total = accessories_with_price.reduce((sum, a) => sum + (a.price * a.qty), 0);
    const capex = Number(v.base_price) + accessories_total;
    const residual = (Number(v.residual_rate) || 0) * capex;
    const annualRate = Number(v.rate) || 0.12;
    const rateMonthly = annualRate / 12;
    const n = Number(term_months);
    const pv = capex - residual;
    const pmt = rateMonthly === 0 ? -(pv / n)
      : -(rateMonthly * pv) / (1 - Math.pow(1 + rateMonthly, -n));
    const monthly_ex_vat = Math.round(pmt);

    // 4) Insert quote row
    const { data: quoteRow, error: qErr } = await sb.from("quotes").insert({
      entity_id,
      user_id: userId,
      vehicle_code,
      term_months,
      distance_km,
      accessories: accessories_with_price,
      result: { accessories_total, monthly_ex_vat }
    }).select("*").single();
    if (qErr || !quoteRow) throw new Error(qErr?.message || "Failed to insert quote");

    // 5) Build PDF
    let logoBytes: Uint8Array | undefined = undefined;
    try {
      const logoPath = path.join(process.cwd(), "public", BRAND.logoPath.replace(/^\//, ""));
      logoBytes = await fs.readFile(logoPath);
    } catch {}

    const pdfBytes = await buildQuotePdf({
      quoteId: quoteRow.id,
      dateISO: new Date().toISOString(),
      customer,
      vehicle: { code: vehicle_code, term_months, distance_km },
      amounts: { accessories_total, monthly_ex_vat },
      accessories: accessories_with_price
    }, logoBytes);

    // 6) Upload to Storage (service role)
    const svc = getServiceSupabase();
    const filename = `quotes/${quoteRow.id}.pdf`;
    const up = await svc.storage.from("quotes").upload(filename, pdfBytes, {
      contentType: "application/pdf",
      upsert: true
    });
    if (up.error) throw up.error;

    // 7) Sign URL (e.g., 1 hour)
    const signed = await svc.storage.from("quotes").createSignedUrl(filename, 60 * 60);
    if (signed.error || !signed.data) throw signed.error || new Error("Failed to sign URL");

    return NextResponse.json({
      quote_id: quoteRow.id,
      pdf_signed_url: signed.data.signedUrl
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Bad request" }, { status: 400 });
  }
}
