import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function buildWcpAuditPdf(assessment: any, logoBytes: Uint8Array) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawText("Afrirent - Waste Compactor Audit Report", { x: 50, y: 800, size: 16, font, color: rgb(0.9, 0.4, 0.15) });
  page.drawText(`Vehicle: ${assessment.vehicle}`, { x: 50, y: 770, size: 12, font });
  page.drawText(`Inspector: ${assessment.operator}`, { x: 50, y: 750, size: 12, font });

  let y = 700;
  for (const item of assessment.items) {
    page.drawText(`${item.category} - ${item.item}: ${item.status}`, { x: 50, y, size: 10, font });
    y -= 14;
  }

  return await pdf.save();
}
