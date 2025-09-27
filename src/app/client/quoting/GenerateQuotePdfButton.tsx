"use client";
import { useState } from "react";

type Accessory = { name: string; price: number };
type QuotePayload = {
  quoteNumber: string;
  customer: { name: string };
  costCenter?: string;
  vehicle: { make: string; model: string; derivative: string; mmCode: string };
  options: { accessories: Accessory[] };
  pricing: { base: number; opex: number; monthly: number; total: number; termMonths: number; mileage: number };
  notes?: string;
  generatedBy?: string;
};

export default function GenerateQuotePdfButton({ payload }: { payload: QuotePayload }) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const onClick = async () => {
    setBusy(true);
    setUrl(null);
    try {
      const res = await fetch("/api/quotes/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setUrl(json.url);
    } catch (e: any) {
      alert(e.message || "Failed to generate PDF");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-x-3">
      <button className="btn" onClick={onClick} disabled={busy}>
        {busy ? "Generating…" : "Generate PDF"}
      </button>
      {url && (
        <a className="navlink inline-block" href={url} target="_blank" rel="noreferrer">
          Open / Share PDF
        </a>
      )}
    </div>
  );
}

