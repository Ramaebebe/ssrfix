"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { priceQuote, type QuoteOutput } from "@/lib/quoteEngine";
type Vehicle = { mmCode: string; make: string; model: string; derivative: string; capex: number; };
type RiskGrade = "A" | "B" | "C" | "D" | "E";
type QuoteInputUI = { mmCode: string; termMonths: number; residualPct: number; rateApr: number; mileageKmPerMonth: number; maintenanceRpm: number; tyresRpm: number; insuranceRpm: number; adminRpm: number; riskGrade: RiskGrade; excessCpkCents: number; };
export default function QuotingPage() {
  const [catalog, setCatalog] = useState<Vehicle[]>([]);
  const [input, setInput] = useState<QuoteInputUI>({ mmCode:"", termMonths:48, residualPct:25, rateApr:12.5, mileageKmPerMonth:2000, maintenanceRpm:450, tyresRpm:180, insuranceRpm:350, adminRpm:99, riskGrade:"B", excessCpkCents:15 });
  const [output, setOutput] = useState<QuoteOutput | null>(null);
  useEffect(()=>{ fetch("/vehicles.sample.json").then(r=>r.json()).then(setCatalog); },[]);
  const chosen = catalog.find(v=>v.mmCode===input.mmCode);
  const calc = () => { if (!chosen) return; setOutput(priceQuote({ ...input, capex: chosen.capex } as any)); };
  return (
    <main className="container-tight max-w-3xl">
      <div className="card p-5">
        <h1 className="text-2xl font-bold mb-3">Create Quote</h1>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="text-sm text-white/70">Vehicle</label>
            <select className="input" value={input.mmCode} onChange={(e)=> setInput(s=>({...s, mmCode: e.target.value}))}>
              <option value="">Select...</option>
              {catalog.map(v=>(<option key={v.mmCode} value={v.mmCode}>{v.make} {v.model} {v.derivative} — MM {v.mmCode} — R{v.capex.toLocaleString()}</option>))}
            </select>
          </div>
          <div><label className="text-sm text-white/70">Term (months)</label><input className="input" type="number" value={input.termMonths} onChange={(e)=> setInput(s=>({...s, termMonths: +e.target.value}))}/></div>
          <div><label className="text-sm text-white/70">Residual (%)</label><input className="input" type="number" value={input.residualPct} onChange={(e)=> setInput(s=>({...s, residualPct: +e.target.value}))}/></div>
          <div><label className="text-sm text-white/70">APR (%)</label><input className="input" type="number" value={input.rateApr} onChange={(e)=> setInput(s=>({...s, rateApr: +e.target.value}))}/></div>
          <div><label className="text-sm text-white/70">Mileage (km/mo)</label><input className="input" type="number" value={input.mileageKmPerMonth} onChange={(e)=> setInput(s=>({...s, mileageKmPerMonth: +e.target.value}))}/></div>
          <div><label className="text-sm text-white/70">Maintenance (R/pm)</label><input className="input" type="number" value={input.maintenanceRpm} onChange={(e)=> setInput(s=>({...s, maintenanceRpm: +e.target.value}))}/></div>
          <div><label className="text-sm text-white/70">Tyres (R/pm)</label><input className="input" type="number" value={input.tyresRpm} onChange={(e)=> setInput(s=>({...s, tyresRpm: +e.target.value}))}/></div>
          <div><label className="text-sm text-white/70">Insurance (R/pm)</label><input className="input" type="number" value={input.insuranceRpm} onChange={(e)=> setInput(s=>({...s, insuranceRpm: +e.target.value}))}/></div>
          <div><label className="text-sm text-white/70">Admin (R/pm)</label><input className="input" type="number" value={input.adminRpm} onChange={(e)=> setInput(s=>({...s, adminRpm: +e.target.value}))}/></div>
          <div><label className="text-sm text-white/70">Risk Grade (A–E)</label><select className="input" value={input.riskGrade} onChange={(e)=> setInput(s=>({...s, riskGrade: e.target.value as RiskGrade}))}>{["A","B","C","D","E"].map(g=>(<option key={g} value={g}>{g}</option>))}</select></div>
          <div><label className="text-sm text-white/70">Excess CPK (c/km)</label><input className="input" type="number" value={input.excessCpkCents} onChange={(e)=> setInput(s=>({...s, excessCpkCents: +e.target.value}))}/></div>
        </div>
        <button className="btn mt-4" onClick={calc} disabled={!chosen}>Calculate</button>
      </div>
      {output && (<div className="card p-5 mt-4"><h2 className="text-xl font-semibold mb-3">Quote Result</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div><div className="text-white/70 text-sm">Monthly Payment</div><div className="text-2xl font-bold">R {output.monthlyPayment.toLocaleString()}</div></div>
          <div><div className="text-white/70 text-sm">Total Cost</div><div className="text-2xl font-bold">R {output.totalCost.toLocaleString()}</div></div>
        </div></div>)}
    </main>
  );
}
