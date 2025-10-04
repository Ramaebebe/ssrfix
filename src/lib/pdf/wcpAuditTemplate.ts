// src/lib/pdf/wcpAuditTemplate.ts
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export type WcpAuditPdfData = {
  vehicle: { reg: string; vin: string; make: string; model: string };
  items: { category: string; field: string; status: "Pass" | "Fail" | "N/A"; notes?: string | null }[];
  meta?: { assessmentId: string; createdAt: string; operatorId?: string | null };
};

export async function buildWcpAuditPdf(data: WcpAuditPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]); // A4 landscape
  const { height } = page.getSize();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const title = "Waste Compactor Assessment Report";

  // Header
  page.drawText(title, { x: 40, y: height - 60, size: 18, font, color: rgb(0.925, 0.392, 0.145) });
  const v = data.vehicle;
  page.drawText(`Vehicle: ${v.make} ${v.model} | Reg: ${v.reg} | VIN: ${v.vin}`, { x: 40, y: height - 90, size: 10, font });

  if (data.meta) {
    page.drawText(
      `Assessment: ${data.meta.assessmentId} | Created: ${new Date(data.meta.createdAt).toLocaleString()} | Operator: ${data.meta.operatorId ?? "-"}`,
      { x: 40, y: height - 110, size: 9, font, color: rgb(0.3, 0.3, 0.3) }
    );
  }

  // Items
  let y = height - 140;
  const line = (text: string) => {
    page.drawText(text, { x: 40, y, size: 9, font });
    y -= 14;
  };

  for (const it of data.items.slice(0, 30)) {
    line(`[${it.category}] ${it.field} — ${it.status}${it.notes ? ` (${it.notes})` : ""}`);
    if (y < 40) break;
  }

  return pdf.save();
}
