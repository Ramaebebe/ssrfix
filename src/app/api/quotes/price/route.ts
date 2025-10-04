// src/app/api/quotes/price/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getRouteSupabase } from "@/lib/supabase/server";
import { priceQuote } from "@/lib/quoteEngine";

type Body = {
  vehicleId: string;
  accessories?: string[];
  termMonths: number;
  limitKm?: number;
};

type VehicleRow = {
  id: string;
  base_price?: number | null;
  finance_rate?: number | null; // e.g. 0.14 for 14% p.a.
  make?: string | null;
  model?: string | null;
  reg?: string | null;
};

type AccessoryRow = {
  id: string;
  name?: string | null;
  price?: number | null;
};

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const sb = getRouteSupabase();
    const body = (await req.json()) as Body;

    if (!body?.vehicleId || !body?.termMonths) {
      return NextResponse.json(
        { error: "vehicleId and termMonths are required" },
        { status: 400 }
      );
    }

    // 1) Vehicle
    const { data: vehicle, error: vehErr } = await sb
      .from("portal.vehicles")
      .select("id, base_price, finance_rate, make, model, reg")
      .eq("id", body.vehicleId)
      .single<VehicleRow>();

    if (vehErr || !vehicle) {
      return NextResponse.json(
        { error: vehErr?.message || "Vehicle not found" },
        { status: 404 }
      );
    }

    // 2) Accessories (optional)
    let accessoriesTotal = 0;
    let accessoriesRows: AccessoryRow[] = [];
    if (Array.isArray(body.accessories) && body.accessories.length > 0) {
      const { data: accs, error: accErr } = await sb
        .from("portal.accessories")
        .select("id, name, price")
        .in("id", body.accessories)
        .returns<AccessoryRow[]>();

      if (accErr) {
        return NextResponse.json({ error: accErr.message }, { status: 400 });
      }

      accessoriesRows = accs ?? [];
      accessoriesTotal = (accs ?? []).reduce(
        (sum, a) => sum + (Number(a.price) || 0),
        0
      );
    }

    // 3) Build inputs the current priceQuote expects
    const basePrice = Number(vehicle.base_price) || 0;
    const ratePerAnnum = Number(vehicle.finance_rate) || 0.14; // sensible default 14%
    const termMonths = Number(body.termMonths);

    const quoteCalc = priceQuote({
      basePrice,
      accessoriesTotal,
      ratePerAnnum,
      termMonths,
    });
    const total = quoteCalc.monthly * termMonths; // <-- compute total here

    // 4) (Optional) store a thin quote record
    const { data: sessionWrap } = await sb.auth.getSession();
    const userId = sessionWrap?.session?.user?.id ?? null;

    const { data: stored, error: storeErr } = await sb
      .from("portal.quotes")
      .insert({
        vehicle_id: vehicle.id,
        created_by: userId,
        term_months: termMonths,
        accessories_ids: body.accessories ?? [],
        base_price: basePrice,
        accessories_total: accessoriesTotal,
        rate_pa: ratePerAnnum,
        result_monthly: quoteCalc.monthly,
        result_total: total, // <-- fixed
      })
      .select("id")
      .single();

    if (storeErr) {
      // Not fatal for pricing; still return the computed quote
      console.warn("quotes insert failed:", storeErr.message);
    }

    return NextResponse.json({
      ok: true,
      quoteId: stored?.id ?? null,
      vehicle: {
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        reg: vehicle.reg,
        basePrice,
        ratePerAnnum,
      },
      accessories: accessoriesRows,
      inputs: {
        termMonths,
        accessoriesTotal,
      },
      result: {
        ...quoteCalc,
        total, // <-- included in the response for the UI
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
