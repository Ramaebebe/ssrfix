// src/lib/pdf/auditTemplate.ts
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/** Single finding from a checklist item */
export type AuditFinding = { label?: string; value?: string };

/** Photo blob used by the PDF renderer */
export type PhotoBlob = { filename: string; bytes: Uint8Array };

/** Input shape for building the audit PDF */
export type AuditPdfInput = {
  id: string;
  date: string; // ISO acceptable
  inspector: string;
  vehicle: { reg: string; vin: string; make: string; model: string };
  location: string; // already normalized string (e.g., "lat, lng — address")
  findings: string | AuditFinding[];
  notes?: string;
  photos: PhotoBlob[];
};

/**
 * Build a branded, single/multi-page PDF for a vehicle audit.
 * Returns a Uint8Array of the finished PDF bytes.
 */
export async function buildAuditPdf(
  input: AuditPdfInput,
  logoBytes?: Uint8Array
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  // A4 portrait in points
  const pageSize: [number, number] = [595.28, 841.89];

  // Fonts
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const heading = rgb(0.925, 0.392, 0.145); // Afrirent orange vibe
  const text = rgb(1, 1, 1);
  const muted = rgb(0.8, 0.8, 0.8);

  // Try embed logo if provided
  let logo: { width: number; height: number; scale: (n: number) => { width: number; height: number } } | null = null;
  if (logoBytes && logoBytes.length > 0) {
    try {
      // pdf-lib auto-detects via separate calls
      try {
        logo = await pdf.embedPng(logoBytes);
      } catch {
        logo = await pdf.embedJpg(logoBytes);
      }
    } catch {
      logo = null;
    }
  }

  const wrap = (str: string, max = 88) => {
    const out: string[] = [];
    const words = (str || "").split(/\s+/);
    let line = "";
    for (const w of words) {
      const tryLine = line ? `${line} ${w}` : w;
      if (tryLine.length > max) {
        if (line) out.push(line);
        line = w;
      } else {
        line = tryLine;
      }
    }
    if (line) out.push(line);
    return out;
  };

  const newPage = () => pdf.addPage(pageSize);

  const drawHeader = (pg: any) => {
    const sz = pg.getSize();
    const w = sz.width;
    const h = sz.height;

    // banner
    pg.drawRectangle({
      x: 0,
      y: h - 64,
      width: w,
      height: 64,
      color: heading,
    });

    // title
    pg.drawText("Afrirent — Vehicle Audit Report", {
      x: 40,
      y: h - 42,
      size: 16,
      font: bold,
      color: rgb(0, 0, 0),
    });

    // logo (top-right)
    if (logo) {
      const scaled = logo.scale(0.25);
      pg.drawImage(logo, {
        x: w - scaled.width - 28,
        y: h - scaled.height - 20,
        width: scaled.width,
        height: scaled.height,
      });
    }
  };

  // normalize findings to a single multi-line string
  const findingsText =
    typeof input.findings === "string"
      ? input.findings || "No findings."
      : (input.findings || [])
          .map((f) => {
            const label = (f?.label ?? "").toString().trim();
            const value = (f?.value ?? "").toString().trim();
            return label ? `${label}: ${value}` : value;
          })
          .filter((l) => l.length > 0)
          .join("\n") || "No findings.";

  // Render first page
  let page = newPage();
  drawHeader(page);
  let y = page.getSize().height - 90;
  const left = 40;

  // Meta block
  const meta = [
    ["Audit ID", input.id],
    ["Date", new Date(input.date).toLocaleString()],
    ["Inspector", input.inspector || "N/A"],
    ["Location", input.location || "N/A"],
  ];

  for (const [k, v] of meta) {
    page.drawText(`${k}:`, { x: left, y, size: 11, font: bold, color: text });
    page.drawText(String(v ?? ""), { x: left + 110, y, size: 11, font, color: text });
    y -= 16;
  }

  y -= 8;

  // Vehicle block
  page.drawText("Vehicle", { x: left, y, size: 12, font: bold, color: text });
  y -= 16;

  const vehLines = [
    ["Registration", input.vehicle.reg || ""],
    ["VIN", input.vehicle.vin || ""],
    ["Make", input.vehicle.make || ""],
    ["Model", input.vehicle.model || ""],
  ];
  for (const [k, v] of vehLines) {
    page.drawText(`${k}:`, { x: left, y, size: 11, font: bold, color: text });
    page.drawText(String(v ?? ""), { x: left + 110, y, size: 11, font, color: text });
    y -= 16;
  }

  y -= 10;

  // Findings
  page.drawText("Findings", { x: left, y, size: 12, font: bold, color: text });
  y -= 16;

  for (const line of wrap(findingsText, 95)) {
    if (y < 80) {
      page = newPage();
      drawHeader(page);
      y = page.getSize().height - 80;
    }
    page.drawText(line, { x: left, y, size: 10.5, font, color: text });
    y -= 14;
  }

  y -= 10;

  // Notes
  if (input.notes && input.notes.trim().length) {
    page.drawText("Notes", { x: left, y, size: 12, font: bold, color: text });
    y -= 16;
    for (const line of wrap(input.notes, 95)) {
      if (y < 80) {
        page = newPage();
        drawHeader(page);
        y = page.getSize().height - 80;
      }
      page.drawText(line, { x: left, y, size: 10.5, font, color: text });
      y -= 14;
    }
  }

  // Photos grid
  if (input.photos && input.photos.length) {
    if (y < 160) {
      page = newPage();
      drawHeader(page);
      y = page.getSize().height - 80;
    }
    page.drawText("Photos", { x: left, y, size: 12, font: bold, color: text });
    y -= 18;

    const maxW = page.getSize().width - left * 2;
    const cellW = 160;
    const cellH = 110;
    const gap = 14;

    let x = left;
    let rowH = 0;

    for (const p of input.photos) {
      // embed image (try png then jpg)
      let img: any = null;
      try {
        img = await pdf.embedPng(p.bytes);
      } catch {
        try {
          img = await pdf.embedJpg(p.bytes);
        } catch {
          img = null;
        }
      }
      if (!img) continue;

      const scale = Math.min(cellW / img.width, cellH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;

      if (x + w > left + maxW) {
        // new row
        x = left;
        y -= (rowH + 20);
        rowH = 0;
      }

      if (y - h < 80) {
        // new page
        page = newPage();
        drawHeader(page);
        y = page.getSize().height - 80;
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
