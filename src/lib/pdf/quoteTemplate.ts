import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { BRAND } from "./brand";

type Option = { label: string; monthlyPayment: number; totalCost: number };
type QuotePayload = {
  quoteId: string;
  createdAt?: string; // ISO
  customer: { name: string; email?: string; costCenter?: string };
  vehicle: { mmCode: string; make: string; model: string; derivative: string };
  term: { months: number; km: number };
  accessories: { label: string; price: number }[];
  pricing: {
    baseCapex: number;
    residualPct: number;
    aprPct: number;
    monthlyPayment: number;
    totalCost: number;
    options?: Option[];
    evAlternative?: Option;
  };
};

export async function buildQuotePdf(data: QuotePayload, logoBytes: Uint8Array) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const brand = rgb(0xEC/255, 0x64/255, 0x25/255);
  const text = rgb(0x11/255,0x18/255,0x27/255);
  const muted = rgb(0x6B/255,0x72/255,0x80/255);

  // Header band
  page.drawRectangle({ x: 0, y: height-90, width, height: 90, color: brand });
  // Logo
  try {
    const logo = await pdf.embedPng(logoBytes);
    const scale = 60 / logo.height;
    page.drawImage(logo, { x: 40, y: height-80, width: logo.width*scale, height: logo.height*scale });
  } catch {
    // ignore
  }
  page.drawText("Quotation", { x: 120, y: height-60, size: 22, font: fontBold, color: rgb(1,1,1) });
  page.drawText(`${BRAND.company}`, { x: 120, y: height-78, size: 10, font, color: rgb(1,1,1) });

  const left = 40;
  let y = height - 120;

  const small = (s:string)=>page.drawText(s, { x:left, y:(y-=14), size:10, font, color: muted });
  const line = ()=>page.drawLine({ start: {x:left,y:(y-=8)}, end:{x:width-40,y}, thickness:0.6, color: rgb(0.9,0.9,0.9)});

  page.drawText(`Quote ID: ${data.quoteId}`, { x:left, y, size:12, font: fontBold, color: text }); y-=18;
  small(`Date: ${data.createdAt ?? new Date().toISOString().slice(0,10)}`);
  small(`Customer: ${data.customer.name}${data.customer.costCenter? " • " + data.customer.costCenter : ""}`);
  if (data.customer.email) small(`Email: ${data.customer.email}`);
  line();

  // Vehicle
  page.drawText("Vehicle", { x:left, y:(y-=14), size:12, font: fontBold, color: text });
  small(`${data.vehicle.make} ${data.vehicle.model} ${data.vehicle.derivative} — MM ${data.vehicle.mmCode}`);
  small(`Term: ${data.term.months} months • ${data.term.km.toLocaleString()} km • APR ${data.pricing.aprPct}% • Residual ${data.pricing.residualPct}%`);
  line();

  // Accessories table
  page.drawText("Accessories", { x:left, y:(y-=14), size:12, font: fontBold, color: text });
  y-=6;
  const colX = [left, left+280, width-120];
  page.drawText("Item", { x:colX[0], y, size:10, font: fontBold, color: muted });
  page.drawText("Qty", { x:colX[1], y, size:10, font: fontBold, color: muted });
  page.drawText("Price (R)", { x:colX[2], y, size:10, font: fontBold, color: muted });
  y-=12;
  let accTotal = 0;
  for (const acc of data.accessories) {
    page.drawText(acc.label, { x: colX[0], y, size:11, font, color: text });
    page.drawText("1", { x: colX[1], y, size:11, font, color: text });
    page.drawText(acc.price.toLocaleString(), { x: colX[2], y, size:11, font, color: text });
    y-=14;
    accTotal += acc.price;
  }
  if (data.accessories.length === 0) { page.drawText("None", { x:colX[0], y, size:11, font, color: muted }); y-=14; }
  line();

  // Pricing summary
  const boxY = y-4; y-=4;
  const summary = [
    ["Vehicle Capex", `R ${data.pricing.baseCapex.toLocaleString()}`],
    ["Accessories", `R ${accTotal.toLocaleString()}`],
    ["Residual", `${data.pricing.residualPct}%`],
    ["APR", `${data.pricing.aprPct}%`],
    ["Monthly Payment", `R ${data.pricing.monthlyPayment.toLocaleString()}`],
    ["Total Cost (Term)", `R ${data.pricing.totalCost.toLocaleString()}`],
  ];
  for (const [k,v] of summary) {
    page.drawText(k, { x:left, y:(y-=14), size:11, font, color: text });
    page.drawText(v, { x: width-220, y, size:11, font: fontBold, color: text });
  }
  line();

  // Options + EV
  page.drawText("Alternatives", { x:left, y:(y-=14), size:12, font: fontBold, color: text });
  const opts = data.pricing.options ?? [];
  let altRows = 0;
  for (const o of opts) {
    page.drawText(o.label, { x:left, y:(y-=14), size:11, font, color: text });
    page.drawText(`R ${o.monthlyPayment.toLocaleString()} / mo • Total R ${o.totalCost.toLocaleString()}`, { x:left+180, y, size:11, font, color: muted });
    altRows++;
  }
  if (data.pricing.evAlternative) {
    const ev = data.pricing.evAlternative;
    page.drawText("EV Alternative", { x:left, y:(y-=14), size:11, font: fontBold, color: text });
    page.drawText(`${ev.label}: R ${ev.monthlyPayment.toLocaleString()} / mo • Total R ${ev.totalCost.toLocaleString()}`, { x:left+120, y, size:11, font, color: muted });
    altRows++;
  }
  if (altRows===0) { page.drawText("—", { x:left, y:(y-=14), size:11, font, color: muted }); }

  // Acceptance block
  y -= 24;
  page.drawText("Acceptance", { x:left, y:(y-=14), size:12, font: fontBold, color: text });
  page.drawText("I hereby accept the quotation above and authorize Afrirent to proceed.", { x:left, y:(y-=14), size:10, font, color: text });
  page.drawText("Name: ________________________   Signature: ________________________   Date: ____________", { x:left, y:(y-=18), size:10, font, color: text });

  // Footer
  const footerY = 40;
  page.drawLine({ start:{x:left,y:footerY+18}, end:{x:width-40,y:footerY+18}, thickness:0.6, color: rgb(0.9,0.9,0.9)});
  page.drawText(`${BRAND.company} • ${BRAND.email} • ${BRAND.phone} • ${BRAND.web}`, { x:left, y:footerY, size:9, font, color: muted });

  return await pdf.save();
}

