// src/lib/pdf/quoteTemplate.ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type QuotePdfData = {
  quote: {
    id: string;
    entityId: string | null;
    termMonths: number;
    limitKm: number;
    ratePerAnnum: number;
    principal: number;
    monthly: number;
  };
  vehicle: {
    reg: string;
    vin: string;
    make: string;
    model: string;
    basePrice: number;
  };
  accessories: Array<{
    id: string;
    name: string;
    price: number;
  }>;
};

/**
 * Very small, brand-neutral PDF to keep the pipeline working.
 * You can embellish later with logos, tables, etc.
 */
export async function buildQuotePdf(data: QuotePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4 portrait in points
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const draw = (text: string, x: number, y: number, size = 12) => {
    page.drawText(text, { x, y, size, font, color: rgb(0.1, 0.1, 0.1) });
  };

  let y = 800;
  draw("Afrirent — Quote", 50, y, 18); y -= 30;
  draw(`Quote ID: ${data.quote.id}`, 50, y); y -= 18;
  draw(`Entity: ${data.quote.entityId ?? "-"}`, 50, y); y -= 18;
  draw(`Term: ${data.quote.termMonths} months`, 50, y); y -= 18;
  draw(`Limit: ${data.quote.limitKm.toLocaleString()} km`, 50, y); y -= 18;
  draw(`Rate (p.a.): ${data.quote.ratePerAnnum}%`, 50, y); y -= 18;
  draw(`Principal: R ${data.quote.principal.toLocaleString()}`, 50, y); y -= 18;
  draw(`Monthly: R ${data.quote.monthly.toLocaleString()}`, 50, y); y -= 30;

  draw("Vehicle", 50, y, 14); y -= 22;
  draw(`Reg: ${data.vehicle.reg}`, 50, y); y -= 18;
  draw(`VIN: ${data.vehicle.vin}`, 50, y); y -= 18;
  draw(`Make/Model: ${data.vehicle.make} ${data.vehicle.model}`, 50, y); y -= 18;
  draw(`Base Price: R ${data.vehicle.basePrice.toLocaleString()}`, 50, y); y -= 30;

  draw("Accessories", 50, y, 14); y -= 22;
  if (!data.accessories.length) {
    draw("None", 50, y); y -= 18;
  } else {
    for (const a of data.accessories) {
      draw(`• ${a.name} — R ${a.price.toLocaleString()}`, 50, y);
      y -= 16;
      if (y < 60) { y = 780; doc.addPage([595, 842]); }
    }
  }

  const bytes = await doc.save();
  return bytes; // Uint8Array
}
