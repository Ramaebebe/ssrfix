import { NextRequest, NextResponse } from "next/server";
import { getRouteSupabase } from "@/lib/supabase/server";

type QuoteInput = {
  vehicle_code: string;
  term_months: number;
  distance_km: number;
  accessories: { code: string; qty: number }[];
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as QuoteInput;
    const supabase = getRouteSupabase();

    // 1) Fetch catalog from DB (vehicles & accessories)
    const [{ data: v }, { data: acc }] = await Promise.all([
      supabase.from("vehicles").select("*").eq("code", body.vehicle_code).single(),
      supabase.from("accessories").select("code, price").in("code", body.accessories.map(a => a.code))
    ]);
    if (!v) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

    // 2) Price engine (centralized & documented)
    // PMT (simplified): monthly payment = rateMonthly * (PV - Residual) / (1 - (1+rateMonthly)^-n)
    const accessoriesTotal = (acc || []).reduce((sum, a) => {
      const qty = body.accessories.find(x => x.code === a.code)?.qty ?? 0;
      return sum + (Number(a.price) * qty);
    }, 0);

    const capex = Number(v.base_price) + accessoriesTotal;
    const residual = (Number(v.residual_rate) || 0) * capex; // e.g. 0.2
    const annualRate = Number(v.rate) || 0.12;
    const rateMonthly = annualRate / 12;
    const n = body.term_months;
    const pv = capex - residual;

    const pmt = rateMonthly === 0 ? -(pv / n)
      : -(rateMonthly * pv) / (1 - Math.pow(1 + rateMonthly, -n));

    return NextResponse.json({
      summary: {
        vehicle: v.code,
        term_months: body.term_months,
        distance_km: body.distance_km,
        accessories_total: accessoriesTotal,
        monthly_ex_vat: Math.round(pmt)
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Bad request" }, { status: 400 });
  }
}
