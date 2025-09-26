"use client";

import { useEffect, useMemo, useState } from "react";
import { QuoteOutput } from "@/lib/quoteEngine";

type Vehicle = {
  mmCode: string;
  make: string;
  model: string;
  derivative: string;
  capex: number;
};

type RiskGrade = "A" | "B" | "C" | "D" | "E";

type QuoteInputUI = {
  mmCode: string;
  termMonths: number;
  residualPct: number;
  rateApr: number;
  mileageKmPerMonth: number;
  maintenanceRpm: number;
  tyresRpm: number;
  insuranceRpm: number;
  adminRpm: number;
  riskGrade: RiskGrade;
  excessCpkCents: number;
};

// Minimal client helpers
async function postJSON<T>(url: string, body: any, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export default function QuotingPage() {
  const [catalog, setCatalog] = useState<Vehicle[]>([]);
  const [input, setInput] = useState<QuoteInputUI>({
    mmCode: "",
    termMonths: 36,
    residualPct: 25,
    rateApr: 12.5,
    mileageKmPerMonth: 180000 / 36,
    maintenanceRpm: 450,
    tyresRpm: 180,
    insuranceRpm: 350,
    adminRpm: 99,
    riskGrade: "B",
    excessCpkCents: 15,
  });
  const [output, setOutput] = useState<QuoteOutput | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/vehicles.sample.json").then((r) => r.json()).then(setCatalog).catch(()=>{});
  }, []);

  const chosen = useMemo(() => catalog.find((v) => v.mmCode === input.mmCode), [catalog, input.mmCode]);

  const calculate = async () => {
    setError(null);
    setOutput(null);
    setPdfUrl(null);
    if (!chosen) return;
    try {
      // Let server do the canonical calc to avoid drift
      const res = await postJSON<QuoteOutput>("/api/quotes/price", {
        ...input,
        capex: chosen.capex,
      });
      setOutput(res);
    } catch (e:any) {
      setError(e.message ?? "Failed to calculate quote");
    }
  };

  const generatePdf = async () => {
    if (!chosen || !output) return;
    setError(null);
    setLoadingPdf(true);
    setPdfUrl(null);
    try {
      // build server payload matching /api/quotes/pdf contract
      const body = {
        quoteId: `Q-${Date.now()}`,
        customer: {
          // Optional: if you store authenticated profile, plumb it here
          name: "Afrirent Client",
          email: "client@example.com",
          costCenter: "Default",
        },
        vehicle: {
          mmCode: chosen.mmCode,
          make: chosen.make,
          model: chosen.model,
          derivative: chosen.derivative,
        },
        term: { months: input.termMonths, km: Math.round(input.mileageKmPerMonth * input.termMonths) },
        accessories: [
          // This demo uses the RPM lines as selected accessories for illustration
          ...(input.maintenanceRpm ? [{ label: "Maintenance plan (pm)", price: input.maintenanceRpm }] : []),
          ...(input.tyresRpm ? [{ label: "Tyres (pm)", price: input.tyresRpm }] : []),
          ...(input.insuranceRpm ? [{ label: "Insurance (pm)", price: input.insuranceRpm }] : []),
          ...(input.adminRpm ? [{ label: "Admin (pm)", price: input.adminRpm }] : []),
        ],
        pricing: {
          baseCapex: chosen.capex,
          residualPct: input.residualPct,
          aprPct: input.rateApr,
          monthlyPayment: output.monthlyPayment,
          totalCost: output.totalCost,
          options: [
            { label: "Option 1 (36/180k)", monthlyPayment: output.monthlyPayment, totalCost: output.totalCost },
            { label: "Option 2 (48/200k)", monthlyPayment: Math.round(output.monthlyPayment * 0.92), totalCost: Math.round(output.totalCost * 1.22) },
            { label: "Option 3 (60/200k)", monthlyPayment: Math.round(output.monthlyPayment * 0.85), totalCost: Math.round(output.totalCost * 1.45) },
          ],
          evAlternative: { label: "EV Alternative", monthlyPayment: Math.round(output.monthlyPayment * 1.08), totalCost: Math.round(output.totalCost * 1.12) },
        },
        store: true,              // ask API to save to Storage if available
        returnSignedUrl: true,    // ask API to respond with a signed URL directly
      };

      const res = await postJSON<{ pdfUrl?: string; path?: string; error?: string }>("/api/quotes/pdf", body);
      if (res.error) throw new Error(res.error);
      if (res.pdfUrl) {
        setPdfUrl(res.pdfUrl);
      } else if (res.path) {
        // fallback if API returned path only; call helper endpoint you have (/api/storage/signed-url)
        const signed = await postJSON<{ url: string }>("/api/storage/signed-url", {
          bucket: "signed-quotes",
          path: res.path,
          expiresIn: 60 * 60, // 1h
        });
        setPdfUrl(signed.url);
      } else {
        throw new Error("PDF generated but no URL returned");
      }
    } catch (e:any) {
      setError(e.message ?? "Failed to generate PDF");
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <div className="container-tight">
      <div className="card p-4 mb-4">
        <h1 className="text-xl font-semibold mb-2">Create Quote</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Vehicle</label>
            <select className="input" value={input.mmCode} onChange={(e)=>setInput(s=>({...s, mmCode: e.target.value}))}>
              <option value="">Select...</option>
              {catalog.map(v=>(
                <option key={v.mmCode} value={v.mmCode}>
                  {v.make} {v.model} {v.derivative} — MM {v.mmCode} — R{v.capex.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Term (months)</label>
            <input className="input" type="number" value={input.termMonths} onChange={(e)=>setInput(s=>({...s, termMonths: Number(e.target.value||0)}))} />
          </div>

          <div>
            <label className="block text-sm mb-1">Residual (%)</label>
            <input className="input" type="number" value={input.residualPct} onChange={(e)=>setInput(s=>({...s, residualPct: Number(e.target.value||0)}))} />
          </div>

          <div>
            <label className="block text-sm mb-1">APR (%)</label>
            <input className="input" type="number" value={input.rateApr} onChange={(e)=>setInput(s=>({...s, rateApr: Number(e.target.value||0)}))} />
          </div>

          <div>
            <label className="block text-sm mb-1">Mileage (km/mo)</label>
            <input className="input" type="number" value={Math.round(input.mileageKmPerMonth)} onChange={(e)=>setInput(s=>({...s, mileageKmPerMonth: Number(e.target.value||0)}))} />
          </div>

          <div>
            <label className="block text-sm mb-1">Maintenance (R/pm)</label>
            <input className="input" type="number" value={input.maintenanceRpm} onChange={(e)=>setInput(s=>({...s, maintenanceRpm: Number(e.target.value||0)}))} />
          </div>

          <div>
            <label className="block text-sm mb-1">Tyres (R/pm)</label>
            <input className="input" type="number" value={input.tyresRpm} onChange={(e)=>setInput(s=>({...s, tyresRpm: Number(e.target.value||0)}))} />
          </div>

          <div>
            <label className="block text-sm mb-1">Insurance (R/pm)</label>
            <input className="input" type="number" value={input.insuranceRpm} onChange={(e)=>setInput(s=>({...s, insuranceRpm: Number(e.target.value||0)}))} />
          </div>

          <div>
            <label className="block text-sm mb-1">Admin (R/pm)</label>
            <input className="input" type="number" value={input.adminRpm} onChange={(e)=>setInput(s=>({...s, adminRpm: Number(e.target.value||0)}))} />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button className="btn" onClick={calculate} disabled={!chosen}>Calculate</button>
          <button className="btn" onClick={generatePdf} disabled={!chosen || !output || loadingPdf}>
            {loadingPdf ? "Generating PDF..." : "Generate PDF"}
          </button>
        </div>

        {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
      </div>

      {output && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="kpi">
            <div className="text-sm text-white/70">Monthly Payment</div>
            <div className="text-2xl font-semibold">R {output.monthlyPayment.toLocaleString()}</div>
          </div>
          <div className="kpi">
            <div className="text-sm text-white/70">Total Cost</div>
            <div className="text-2xl font-semibold">R {output.totalCost.toLocaleString()}</div>
          </div>
          <div className="kpi">
            <div className="text-sm text-white/70">Residual</div>
            <div className="text-2xl font-semibold">{input.residualPct}%</div>
          </div>
        </div>
      )}

      {pdfUrl && (
        <div className="card p-4 mt-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">Quotation PDF is ready</div>
              <div className="text-sm text-white/70 break-all">{pdfUrl}</div>
            </div>
            <div className="flex gap-2">
              <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn">Open</a>
              <a href={pdfUrl} download className="btn">Download</a>
              <button className="btn"
                onClick={() => navigator.clipboard.writeText(pdfUrl)}>
                Copy link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}