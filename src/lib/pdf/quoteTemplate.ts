import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { BRAND } from "./brand";

export type QuotePdfInput = {
  quoteId: string;
  dateISO: string;
  customer?: { name?: string; contact?: string };
  vehicle: {
    code: string;
    term_months: number;
    distance_km: number;
  };
  amounts: {
    accessories_total: number;
    monthly_ex_vat: number;
  };
  accessories: { code: string; qty: number; price?: number }[];
};

export async function buildQuotePdf(input: QuotePdfInput, logoBytes?: Uint8Array) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4 portrait
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const text = rgb(BRAND.text.r/255, BRAND.text.g/255, BRAND.text.b/255);
  const muted = rgb(BRAND.muted.r/255, BRAND.muted.g/255, BRAND.muted.b/255);
  const primary = rgb(BRAND.primary.r/255, BRAND.primary.g/255, BRAND.primary.b/255);

  const drawHeader = async () => {
    // Bar
    page.drawRectangle({ x: 0, y: 800, width: 595.28, height: 40, color: primary });
    page.drawText(`${BRAND.company} – Quotation`, { x: 40, y: 812, size: 14, font: bold, color: text });

    // Logo (optional)
    if (logoBytes && logoBytes.length > 0) {
      try {
        let img;
        try { img = await pdf.embedPng(logoBytes); }
        catch { img = await pdf.embedJpg(logoBytes); }
        const w = 110;
        const scale = w / img.width;
        const h = img.height * scale;
        page.drawImage(img, { x: 595.28 - w - 24, y: 804 - h/2, width: w, height: h });
      } catch {}
    }
  };

  const label = (x: number, y: number, t: string) =>
    page.drawText(t, { x, y, size: 10, font: bold, color: muted });
  const val = (x: number, y: number, t: string) =>
    page.drawText(t, { x, y, size: 11, font, color: text });

  await drawHeader();

  // Metadata
  label(40, 760, "Quote ID");
  val(140, 760, input.quoteId);
  label(40, 742, "Date");
  val(140, 742, new Date(input.dateISO).toLocaleString());

  if (input.customer?.name) {
    label(40, 720, "Customer");
    val(140, 720, input.customer.name);
  }
  if (input.customer?.contact) {
    label(40, 702, "Contact");
    val(140, 702, input.customer.contact);
  }

  // Vehicle
  label(40, 670, "Vehicle");
  val(140, 670, input.vehicle.code);
  label(40, 652, "Term (months)");
  val(140, 652, String(input.vehicle.term_months));
  label(40, 634, "Contract km");
  val(140, 634, input.vehicle.distance_km.toLocaleString());

  // Accessories table
  label(40, 600, "Accessories");
  const thY = 582;
  const cols = [40, 260, 360, 460];
  page.drawText("Code", { x: cols[0], y: thY, size: 10, font: bold, color: muted });
  page.drawText("Qty",  { x: cols[1], y: thY, size: 10, font: bold, color: muted });
  page.drawText("Price",{ x: cols[2], y: thY, size: 10, font: bold, color: muted });
  page.drawText("Total",{ x: cols[3], y: thY, size: 10, font: bold, color: muted });

  let y = thY - 16;
  for (const a of input.accessories) {
    page.drawText(a.code, { x: cols[0], y, size: 10, font, color: text });
    page.drawText(String(a.qty), { x: cols[1], y, size: 10, font, color: text });
    page.drawText((a.price ?? 0).toLocaleString(), { x: cols[2], y, size: 10, font, color: text });
    page.drawText(((a.price ?? 0) * a.qty).toLocaleString(), { x: cols[3], y, size: 10, font, color: text });
    y -= 16;
  }

  // Summary
  const sumY = y - 20;
  page.drawRectangle({ x: 40, y: sumY - 8, width: 515, height: 70, color: rgb(0,0,0), opacity: 0.08 });
  label(52, sumY + 46, "Accessories Total");
  val(220, sumY + 46, `R ${input.amounts.accessories_total.toLocaleString()}`);
  label(52, sumY + 26, "Monthly (ex VAT)");
  val(220, sumY + 26, `R ${input.amounts.monthly_ex_vat.toLocaleString()}`);
  page.drawText("All pricing subject to final credit approval and standard terms.", { x: 52, y: sumY + 8, size: 9, font, color: muted });

  return await pdf.save();
}
