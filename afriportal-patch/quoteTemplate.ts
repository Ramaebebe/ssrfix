export async function buildQuotePdf(
  data: {
    quoteId: string;
    client: string;
    vehicle: { make: string; model: string; derivative?: string };
    term: string;
    options: Array<{ label: string; price: number }>;
    totals: { monthly: number; upfront?: number };
  },
  logo: Uint8Array
): Promise<Uint8Array> {
  // TODO: implement actual PDF writing (pdf-lib or @react-pdf/renderer server-side)
  // For now, return an empty document to keep types happy.
  return new Uint8Array();
}