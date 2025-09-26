import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { BRAND } from "./brand";

type Photo = { filename: string; bytes: Uint8Array };
type AuditPayload = {
  id: string;
  date: string;
  inspector: string;
  vehicle: { reg: string; vin?: string; make?: string; model?: string };
  location: { lat: number; lng: number; address?: string };
  findings: { label: string; value: string }[];
  notes?: string;
  photos?: Photo[];
};

export async function buildAuditPdf(data: AuditPayload, logoBytes: Uint8Array) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const brand = rgb(0xEC/255, 0x64/255, 0x25/255);
  const text = rgb(0x11/255,0x18/255,0x27/255);
  const muted = rgb(0x6B/255,0x72/255,0x80/255);

  page.drawRectangle({ x: 0, y: height-90, width, height: 90, color: brand });
  try {
    const logo = await pdf.embedPng(logoBytes);
    const scale = 60 / logo.height;
    page.drawImage(logo, { x: 40, y: height-80, width: logo.width*scale, height: logo.height*scale });
  } catch {}
  page.drawText("Vehicle Inspection Report", { x: 120, y: height-60, size: 20, font: bold, color: rgb(1,1,1) });

  const left = 40; let y = height - 120;
  const line = ()=>page.drawLine({ start:{x:left,y:(y-=8)}, end:{x:width-40,y}, thickness:0.6, color: rgb(0.9,0.9,0.9)});

  page.drawText(`Report ID: ${data.id}`, { x:left, y, size:12, font: bold, color: text }); y-=16;
  page.drawText(`Date: ${data.date}`, { x:left, y, size:11, font, color: text }); y-=14;
  page.drawText(`Inspector: ${data.inspector}`, { x:left, y, size:11, font, color: text }); y-=14;
  page.drawText(`Vehicle: ${data.vehicle.reg}${data.vehicle.make? " • "+data.vehicle.make: ""}${data.vehicle.model? " "+data.vehicle.model: ""}${data.vehicle.vin? " • VIN "+data.vehicle.vin: ""}`, { x:left, y, size:11, font, color: text }); y-=14;
  page.drawText(`Location: ${data.location.lat.toFixed(5)}, ${data.location.lng.toFixed(5)}${data.location.address? " • "+data.location.address: ""}`, { x:left, y, size:11, font, color: text }); y-=14;
  line();

  page.drawText("Findings", { x:left, y:(y-=12), size:12, font: bold, color: text });
  for (const f of data.findings) {
    if (y < 200) { // new page before photos
      page.drawText("Continued on next page…", { x:left, y:60, size:9, font, color: muted });
      const p2 = pdf.addPage([595.28, 841.89]);
      page = p2 as any;
      y = 780;
    }
    page.drawText(`${f.label}: `, { x:left, y, size:11, font: bold, color: text });
    page.drawText(`${f.value}`, { x:left+120, y, size:11, font, color: text });
    y-=14;
  }

  if (data.notes) {
    if (y < 200) {
      const p2 = pdf.addPage([595.28, 841.89]); page = p2 as any; y = 780;
    }
    line();
    page.drawText("Notes", { x:left, y:(y-=12), size:12, font: bold, color: text });
    const wrapped = wrapText(data.notes, 90);
    for (const row of wrapped) {
      page.drawText(row, { x:left, y, size:11, font, color: text }); y-=14;
    }
  }

  // Photos grid
  const photos = data.photos ?? [];
  if (photos.length) {
    if (y < 260) { const p2 = pdf.addPage([595.28, 841.89]); page = p2 as any; y = 780; }
    page.drawText("Photos", { x:left, y:(y-=12), size:12, font: bold, color: text });
    y-=6;
    let x = left; let rowH = 0; const maxW = width-40;
    for (let i=0;i<photos.length;i++) {
      const p = photos[i];
      let img;
      try {
        if (p.filename.toLowerCase().endsWith(".jpg") || p.filename.toLowerCase().endsWith(".jpeg")) {
          img = await pdf.embedJpg(p.bytes);
        } else {
          img = await pdf.embedPng(p.bytes);
        }
      } catch { continue; }
      const targetW = 150;
      const scale = targetW / img.width;
      const w = targetW;
      const h = img.height * scale;
      if (x + w > maxW) { // newline
        x = left;
        y -= (rowH + 18);
        rowH = 0;
      }
      if (y - h < 60) { // new page
        const p2 = pdf.addPage([595.28, 841.89]); page = p2 as any; y = 780; x = left; rowH = 0;
      }
      page.drawImage(img, { x, y: y-h, width: w, height: h });
      page.drawText(p.filename, { x, y: y-h-12, size:9, font, color: muted });
      x += w + 12;
      rowH = Math.max(rowH, h);
    }
  }

  return await pdf.save();

  function wrapText(s: string, cols: number) {
    const words = s.split(/\s+/); const rows: string[] = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > cols) {
        rows.push(cur.trim()); cur = w;
      } else {
        cur += " " + w;
      }
    }
    if (cur.trim()) rows.push(cur.trim());
    return rows;
  }
}
