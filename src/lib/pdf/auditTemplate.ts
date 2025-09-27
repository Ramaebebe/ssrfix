// Lightweight PDF builder for Vehicle Audit reports
// Uses pdf-lib. The route should pass images as { filename, bytes } where `bytes` is a Uint8Array.

import { PDFDocument, StandardFonts, rgb, PageSizes, PDFPage } from "pdf-lib";

export type AuditPhoto = { filename: string; bytes: Uint8Array };
export type AuditRecord = {
  id: string;
  vehicleReg: string;
  entity?: string;
  inspector?: string;
  inspectedAt?: string;        // ISO string
  location?: string;           // "lat,lon" or address
  odometerKm?: number;
  findings?: string;           // long text
  status?: string;             // e.g. "OK" | "Needs attention"
};

const pageSize = PageSizes.A4; // [595.28, 841.89]
const text = rgb(0.18, 0.2, 0.25);
const muted = rgb(0.45, 0.47, 0.5);
const brand = rgb(0.925, 0.39, 0.145); // Afrirent orange

function wrap(s: string, max = 96) {
  const out: string[] = [];
  const words = String(s ?? "").split(/\s+/);
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      out.push(line.trim());
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) out.push(line.trim());
  return out;
}

function drawHeader(page: PDFPage, font: any) {
  page.drawRectangle({ x: 0, y: 800, width: 595.28, height: 41.89, color: brand, opacity: 0.08 });
  page.drawText("AFRIRENT – Vehicle Audit Report", { x: 40, y: 818, size: 14, font, color: brand });
}

export async function buildAuditPdf(audit: AuditRecord, photos: AuditPhoto[]) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage(pageSize);
  drawHeader(page, fontBold);

  // Meta
  let y = 780;
  const left = 40;

  const meta = [
    ["Audit ID", audit.id],
    ["Vehicle", audit.vehicleReg],
    ["Entity", audit.entity ?? "-"],
    ["Inspector", audit.inspector ?? "-"],
    ["Date", audit.inspectedAt ? new Date(audit.inspectedAt).toLocaleString() : "-"],
    ["Location", audit.location ?? "-"],
    ["Odometer (km)", audit.odometerKm != null ? String(audit.odometerKm) : "-"],
    ["Status", audit.status ?? "-"],
  ] as const;

  for (const [k, v] of meta) {
    page.drawText(k + ":", { x: left, y, size: 11, font: fontBold, color: text });
    page.drawText(String(v), { x: left + 140, y, size: 11, font, color: text });
    y -= 18;
  }

  // Findings
  y -= 8;
  page.drawText("Findings", { x: left, y, size: 12, font: fontBold, color: text });
  y -= 16;
  for (const l of wrap(audit.findings || "-", 92)) {
    page.drawText(l, { x: left, y, size: 10, font, color: text });
    y -= 14;
    // new page for long findings
    if (y < 120) {
      page = pdf.addPage(pageSize);
      drawHeader(page, fontBold);
      y = 780;
    }
  }

  // Photos grid (3 per row)
  if (photos?.length) {
    y -= 12;
    page.drawText("Photos", { x: left, y, size: 12, font: fontBold, color: text });
    y -= 16;

    let x = left;
    const maxW = 595.28 - left - 40;
    let rowH = 0;

    for (const p of photos) {
      try {
        const img = await pdf.embedJpg(p.bytes).catch(async () => await pdf.embedPng(p.bytes));
        const { width, height } = img;
        const targetW = Math.min(160, maxW);
        const scale = targetW / width;
        const w = width * scale;
        const h = height * scale;

        // newline if overflow on x-axis
        if (x + w > left + maxW) {
          x = left;
          y -= (rowH + 18);
          rowH = 0;
        }
        // new page if not enough vertical space
        if (y - h < 80) {
          page = pdf.addPage(pageSize);
          drawHeader(page, fontBold);
          y = 780;
          x = left;
          rowH = 0;
        }

        page.drawImage(img, { x, y: y - h, width: w, height: h });
        page.drawText(p.filename, { x, y: y - h - 12, size: 9, font, color: muted });
        x += w + 14;
        rowH = Math.max(rowH, h);
      } catch {
        // skip corrupt image
        continue;
      }
    }
  }

  const bytes = await pdf.save();
  return bytes;
}
