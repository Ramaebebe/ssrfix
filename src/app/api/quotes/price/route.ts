import { NextRequest, NextResponse } from "next/server";
import { priceQuote } from "@/lib/quoteEngine";
export async function POST(req: NextRequest) {
  try { const input = await req.json(); const output = priceQuote(input); return NextResponse.json(output); }
  catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
}

