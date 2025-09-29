"use client";
import { useEffect, useState } from "react";
import GenerateQuotePdfButton from "./GenerateQuotePdfButton";

type Vehicle = { id:string; make:string; model:string; variant?:string; ev:boolean; base_price:number };
type Accessory = { id:string; code:string; label:string; price:number };

export default function QuotingPage(){
  const [vehicles,setVehicles]=useState<Vehicle[]>([]);
  const [accs,setAccs]=useState<Accessory[]>([]);
  const [vehicleId,setVehicleId]=useState<string>("");
  const [term,setTerm]=useState(36);
  const [limitKm,setLimitKm]=useState(180000);
  const [picked,setPicked]=useState<string[]>([]);
  const [quoteId,setQuoteId]=useState<string>("");

  useEffect(()=>{
    (async ()=>{
      const r = await fetch("/api/quotes/price",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"catalog"})});
      const j = await r.json();
      setVehicles(j.vehicles); setAccs(j.accessories);
    })();
  },[]);

  const price = async ()=>{
    const r = await fetch("/api/quotes/price",{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ vehicleId, termMonths: term, limitKm, accessories: picked })
    });
    const j = await r.json();
    if (!r.ok){ alert(j.error); return; }
    setQuoteId(j.quoteId);
  };

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Quoting</h1>
      <div className="card p-4 grid md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-white/70">Vehicle</label>
          <select className="input w-full" value={vehicleId} onChange={e=>setVehicleId(e.target.value)}>
            <option value="">Select…</option>
            {vehicles.map(v=><option key={v.id} value={v.id}>{v.make} {v.model} {v.variant||""}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-white/70">Term (months)</label>
          <input className="input w-full" type="number" value={term} onChange={e=>setTerm(Number(e.target.value))}/>
        </div>
        <div>
          <label className="text-sm text-white/70">KM Limit</label>
          <input className="input w-full" type="number" value={limitKm} onChange={e=>setLimitKm(Number(e.target.value))}/>
        </div>
        <div className="md:col-span-3">
          <label className="text-sm text-white/70">Accessories</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {accs.map(a=>{
              const on = picked.includes(a.id);
              return (
                <button key={a.id} className={`tag ${on?"tag-on":""}`} onClick={()=>setPicked(on? picked.filter(x=>x!==a.id): [...picked,a.id])}>
                  {a.label} (R {a.price.toLocaleString()})
                </button>
              );
            })}
          </div>
        </div>
        <div className="md:col-span-3 flex gap-3">
          <button className="btn" onClick={price}>Calculate & Save</button>
          {quoteId && <GenerateQuotePdfButton quoteId={quoteId} />}
        </div>
      </div>
    </main>
  );
}
