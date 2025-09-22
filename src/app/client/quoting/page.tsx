"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useMemo, useRef, useState } from "react";
import { priceQuote, type QuoteOutput } from "@/lib/quoteEngine";
import QuotePDF from "@/components/QuotePDF";
type Vehicle = { mmCode:string; make:string; model:string; derivative:string; capex:number; };
type RiskGrade = "A"|"B"|"C"|"D"|"E";
type QuoteInputUI = { mmCode:string; termMonths:number; residualPct:number; rateApr:number; mileageKmPerMonth:number; maintenanceRpm:number; tyresRpm:number; insuranceRpm:number; adminRpm:number; riskGrade:RiskGrade; excessCpkCents:number; };
export default function QuotingPage(){
  const [catalog,setCatalog]=useState<Vehicle[]>([]);
  const [input,setInput]=useState<QuoteInputUI>({mmCode:"",termMonths:48,residualPct:25,rateApr:12.5,mileageKmPerMonth:2000,maintenanceRpm:450,tyresRpm:180,insuranceRpm:350,adminRpm:99,riskGrade:"B",excessCpkCents:15});
  const [output,setOutput]=useState<QuoteOutput|null>(null);
  useEffect(()=>{ fetch("/vehicles.sample.json").then(r=>r.json()).then(setCatalog);},[]);
  const chosen=catalog.find(v=>v.mmCode===input.mmCode);
  const calc=()=>{ if(!chosen) return; setOutput(priceQuote({ ...input, capex: chosen.capex } as any)); };
  const ref=useRef<HTMLDivElement>(null);
  const selectedVehicleLabel = useMemo(()=>!chosen? "" : `${chosen.make} ${chosen.model} ${chosen.derivative} (MM ${chosen.mmCode})`,[chosen]);
  return (
    <main className="max-w-4xl">
      <div className="card p-6">
        <h1 className="text-3xl font-bold mb-3">Create Quote</h1>
        <p className="section-sub">Pick a vehicle, set the inputs, then calculate and export a branded PDF.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="text-sm text-white/70">Vehicle</label>
            <select className="input" value={input.mmCode} onChange={(e)=> setInput(s=>({...s, mmCode: e.target.value}))}>
              <option value="">Select...</option>
              {catalog.map(v=>(<option key={v.mmCode} value={v.mmCode}>{v.make} {v.model} {v.derivative} — MM {v.mmCode} — R{v.capex.toLocaleString()}</option>))}
            </select>
          </div>
          <div><label className="text-sm text-white/70">Term (months)</label><input className="input" type="number" value={input.termMonths} onChange={(e)=> setInput(s=>({...s, termMonths:+e.target.value}))}/></div>
          <div><label className="text-sm text-white/70">Residual (%)</label><input className="input" type="number" value={input.residualPct} onChange={(e)=> setInput(s=>({...s, residualPct:+e.target.value}))}/></div>
          <div><label className="text-sm text-white/70">APR (%)</label><input className="input" type="number" value={input.rateApr} onChange={(e)=> setInput(s=>({...s, rateApr:+e.target.value}))}/></div>
          <div><label className="text-sm text-white/70">Mileage (km/mo)</label><input className="input" type="number" value={input.mileageKmPerMonth} onChange={(e)=> setInput(s=>({...s, mileageKmPerMonth:+e.target.value}))}/></div>
          <div><label className="text-sm text-white/70">Maintenance (R/pm)</label><input className="input" type="number" value={input.maintenanceRpm} onChange={(e)=> setInput(s=>({...s, maintenanceRpm:+e.target.value}))}/></div>
          <div><label className="text-sm text-white/70">Tyres (R/pm)</label><input className="input" type="number" value={input.tyresRpm} onChange={(e)=> setInput(s=>({...s, tyresRpm:+e.target.value}))}/></div>
          <div><label className="text-sm text-white/70">Insurance (R/pm)</label><input className="input" type="number" value={input.insuranceRpm} onChange={(e)=> setInput(s=>({...s, insuranceRpm:+e.target.value}))}/></div>
          <div><label className="text-sm text-white/70">Admin (R/pm)</label><input className="input" type="number" value={input.adminRpm} onChange={(e)=> setInput(s=>({...s, adminRpm:+e.target.value}))}/></div>
          <div><label className="text-sm text-white/70">Risk Grade (A–E)</label><select className="input" value={input.riskGrade} onChange={(e)=> setInput(s=>({...s, riskGrade:e.target.value as RiskGrade}))}>{["A","B","C","D","E"].map(g=>(<option key={g} value={g}>{g}</option>))}</select></div>
          <div><label className="text-sm text-white/70">Excess CPK (c/km)</label><input className="input" type="number" value={input.excessCpkCents} onChange={(e)=> setInput(s=>({...s, excessCpkCents:+e.target.value}))}/></div>
        </div>
        <div className="flex gap-3 mt-4">
          <button className="btn" onClick={calc} disabled={!chosen}>Calculate</button>
          {output && <QuotePDF refEl={ref} vehicle={selectedVehicleLabel} input={input} output={output} />}
        </div>
      </div>
      {output && (
        <div className="hidden">
          <div ref={ref}>
            <div className="print-a4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="/brand/afrirent_logo.png" alt="Afrirent" style={{height:40}}/>
                  <div className="print-h1">Afrirent Mobility — Quotation</div>
                </div>
                <div className="print-meta">Generated: {new Date().toLocaleDateString()}</div>
              </div>
              <hr style={{margin:"12px 0"}}/>
              <div className="print-meta">Vehicle</div>
              <div style={{fontWeight:600, marginBottom:8}}>{selectedVehicleLabel}</div>
              <table className="print-table">
                <thead><tr><th>Term (months)</th><th>Residual %</th><th>APR %</th><th>Mileage km/mo</th></tr></thead>
                <tbody><tr><td>{input.termMonths}</td><td>{input.residualPct}</td><td>{input.rateApr}</td><td>{input.mileageKmPerMonth}</td></tr></tbody>
              </table>
              <table className="print-table">
                <thead><tr><th>Maintenance</th><th>Tyres</th><th>Insurance</th><th>Admin</th><th>Risk Grade</th></tr></thead>
                <tbody><tr><td>R {input.maintenanceRpm}</td><td>R {input.tyresRpm}</td><td>R {input.insuranceRpm}</td><td>R {input.adminRpm}</td><td>{input.riskGrade}</td></tr></tbody>
              </table>
              <div style={{display:"flex", gap:24, marginTop:16}}>
                <div><div className="print-meta">Monthly Payment</div><div style={{fontSize:24, fontWeight:700}}>R {output.monthlyPayment.toLocaleString()}</div></div>
                <div><div className="print-meta">Total Cost</div><div style={{fontSize:24, fontWeight:700}}>R {output.totalCost.toLocaleString()}</div></div>
              </div>
              <div style={{marginTop:24, fontSize:12, color:"#444"}}>Notes: Figures are indicative for budgeting. Final pricing subject to credit approval and signed agreement.</div>
              <div style={{position:"absolute", right:24, bottom:24, opacity:.08}}><img src="/brand/paw.png" alt="" style={{height:100}}/></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
