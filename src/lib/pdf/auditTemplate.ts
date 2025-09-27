import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type Photo = { filename: string; url: string; };
type Audit = {
  id: string;
  vehicleReg?: string;
  entity?: string;
  inspector?: string;
  location?: string;
  createdAt?: string;
  findings?: string;
};

export async function renderAuditPdf(audit: Audit, photos: Photo[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const title = rgb(0.925, 0.392, 0.145); // Afrirent brand-ish
  const text = rgb(0.14, 0.16, 0.2);
  const muted = rgb(0.45, 0.48, 0.52);

  // --- helpers
  const header = (page: any) => {
    page.drawText("Afrirent — Vehicle Inspection Report", { x: 40, y: 800, size: 16, font: bold, color: title });
    page.drawLine({ start: {x:40, y: 792}, end: {x: 555, y: 792}, color: title, thickness: 1.5 });
  };

  const pageSize: [number, number] = [595.28, 841.89]; // A4
  let page = pdf.addPage(pageSize);
  header(page);

  // Meta
  let y = 760;
  const line = (label: string, value?: string) => {
    page.drawText(label, { x: 40, y, size: 10, font: bold, color: text });
    page.drawText(value ?? "-", { x: 160, y, size: 10, font, color: text });
    y -= 16;
  };

  line("Inspection ID", audit.id);
  line("Vehicle", audit.vehicleReg);
  line("Entity", audit.entity);
  line("Inspector", audit.inspector);
  line("Location", audit.location);
  line("Date", audit.createdAt);

  y -= 8;
  page.drawText("Findings:", { x: 40, y, size: 11, font: bold, color: text });
  y -= 14;

  const wrap = (txt: string, max = 86) => {
    const words = (txt || "-").split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > max) {
        lines.push(cur.trim());
        cur = w;
      } else {
        cur = (cur + " " + w).trim();
      }
    }
    if (cur) lines.push(cur.trim());
    return lines;
  };

  for (const l of wrap(audit.findings || "-", 92)) {
    page.drawText(l, { x: 40, y, size: 10, font, color: text });
    y -= 14;
    if (y < 120) {  # new page for long findings
      page = pdf.addPage(pageSize);
      header(page);
      y = 780;
    }
  }

  // Photos grid
  y -= 10;
  page.drawText("Photo Evidence", { x: 40, y, size: 12, font: bold, color: text });
  y -= 14;

  const left = 40;
  let x = left;
  let rowH = 0;
  const maxW = 555;
  const maxThumbW = 150;
  const maxThumbH = 110;

  for (const p of photos) {
    // fetch & embed image
    let buf: ArrayBuffer;
    if (typeof fetch !== "undefined") {
      const res = await fetch(p.url);
      buf = await res.arrayBuffer();
    } else {
      // In case of restricted runtime (shouldn't happen on Vercel edge/node)
      throw new Error("Fetch unavailable to load image " + p.filename);
    }

    const bytes = new Uint8Array(buf);
    let img;
    try {
      img = await pdf.embedPng(bytes);
    } catch {
      img = await pdf.embedJpg(bytes);
    }
    const iw = img.width, ih = img.height;
    const scale = Math.min(maxThumbW / iw, maxThumbH / ih);
    const w = iw * scale;
    const h = ih * scale;

    if (x + w > maxW) { // newline
      x = left;
      y -= (rowH + 18);
      rowH = 0;
    }
    if (y - h < 60) { // new page
      page = pdf.addPage(pageSize);
      header(page);
      y = 780; x = left; rowH = 0;
    }

    page.drawImage(img, { x, y: y - h, width: w, height: h });
    page.drawText(p.filename, { x, y: y - h - 12, size: 9, font, color: muted });

    rowH = Math.max(rowH, h);
    x += w + 14;
  }

  // footer
  const pages = pdf.getPages();
  pages.forEach((pg, i) => {
    pg.drawText(`Page ${i+1} of ${pages.length}`, { x: 500, y: 20, size: 9, font, color: muted });
  });

  return await pdf.save();
}