// src/lib/pdf/auditTemplate.ts
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type AuditPhoto = { filename: string; bytes: Uint8Array };

export type AuditRecord = {
  id: string;
  date?: string; // <-- added (optional)
  inspector: string;
  vehicle: { reg: string; vin: string; make: string; model: string };
  location: string; // human-readable single string
  findings: string; // multiline string is fine
  notes: string;
  photos: AuditPhoto[];
};

export async function buildAuditPdf(data: AuditRecord, logoBytes?: Uint8Array): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const pageSize: [number, number] = [595.28, 841.89]; // A4
  let page = pdf.addPage(pageSize);

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const text = rgb(0.12, 0.12, 0.12);
  const muted = rgb(0.45, 0.45, 0.45);
  const brand = rgb(0.925, 0.392, 0.145);

  const drawHeader = () => {
    const [w] = page.getSize();
    // Logo
    if (logoBytes && logoBytes.length > 0) {
      // try embed PNG/JPEG
      try {
        const img = logoBytes[0] === 0x89 ? pdf.embedPng(logoBytes) : pdf.embedJpg(logoBytes);
        // await because embed could be promise
      } catch {}
    }
    // Title
    page.drawText("Afrirent Vehicle Audit Report", { x: 40, y: 800, size: 16, font: bold, color: brand });
    const dateStr = (data.date ?? new Date().toISOString()).slice(0, 10);
    page.drawText(`Audit #${data.id} • ${dateStr}`, { x: 40, y: 782, size: 10, font, color: muted });
  };

  drawHeader();

  // Vehicle & inspector block
  let y = 750;
  const line = (label: string, value: string) => {
    page.drawText(label, { x: 40, y, size: 10, font: bold, color: text });
    page.drawText(value || "-", { x: 160, y, size: 10, font, color: text });
    y -= 16;
  };

  line("Inspector", data.inspector || "-");
  line("Registration", data.vehicle.reg || "-");
  line("VIN", data.vehicle.vin || "-");
  line("Make/Model", `${data.vehicle.make || "-"} ${data.vehicle.model || ""}`.trim());
  line("Location", data.location || "-");

  // Findings block (wrap to width)
  y -= 12;
  page.drawText("Findings", { x: 40, y, size: 12, font: bold, color: text });
  y -= 18;

  const wrap = (s: string, max = 92) => {
    const out: string[] = [];
    for (const rawLine of (s || "").split(/\r?\n/)) {
      let cur = rawLine;
      while (cur.length > max) {
        const cut = cur.lastIndexOf(" ", max);
        const n = cut > 0 ? cut : max;
        out.push(cur.slice(0, n));
        cur = cur.slice(n).trimStart();
      }
      out.push(cur);
    }
    return out;
  };

  for (const l of wrap(data.findings || "-", 92)) {
    page.drawText(l, { x: 40, y, size: 10, font, color: text });
    y -= 14;
    if (y < 120) {
      page = pdf.addPage(pageSize);
      drawHeader();
      y = 780;
    }
  }

  // Notes
  y -= 10;
  page.drawText("Notes", { x: 40, y, size: 12, font: bold, color: text });
  y -= 18;
  for (const l of wrap(data.notes || "-", 92)) {
    page.drawText(l, { x: 40, y, size: 10, font, color: text });
    y -= 14;
    if (y < 120) {
      page = pdf.addPage(pageSize);
      drawHeader();
      y = 780;
    }
  }

  // Photos grid (thumbnails)
  if (data.photos?.length) {
    y -= 10;
    page.drawText("Photos", { x: 40, y, size: 12, font: bold, color: text });
    y -= 18;

    let x = 40;
    const left = 40;
    const gap = 12;
    const thumbW = 120;
    let rowH = 0;

    for (const p of data.photos) {
      // embed image
      let img;
      try {
        img = p.bytes[0] === 0x89 ? await pdf.embedPng(p.bytes) : await pdf.embedJpg(p.bytes);
      } catch {
        continue;
      }
      const scale = thumbW / img.width;
      const w = img.width * scale;
      const h = img.height * scale;

      const [pageW] = page.getSize();
      const maxW = pageW - 40;

      if (x + w > maxW) {
        // newline
        x = left;
        y -= rowH + 18;
        rowH = 0;
      }
      if (y - h < 60) {
        // new page
        page = pdf.addPage(pageSize);
        drawHeader();
        y = 780;
        x = left;
        rowH = 0;
      }

      page.drawImage(img, { x, y: y - h, width: w, height: h });
      page.drawText(p.filename, { x, y: y - h - 12, size: 9, font, color: muted });

      x += w + gap;
      rowH = Math.max(rowH, h + 12);
    }
  }

  const bytes = await pdf.save();
  return bytes;
}

