"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { getSupabaseClient } from "@/lib/supabaseClient";

type Vehicle = {
  id?: string;
  mm_code?: string;
  make: string;
  model: string;
  derivative?: string;
  capex: number;
  is_ev?: boolean;
};

type Accessory = { code: string; label: string; price: number };

type QuoteOption = {
  label: string;
  termMonths: number;
  mileageKm: number;
  residualPct: number;
  aprPct: number;
  accessories: string[];
};

type QuoteResult = {
  label: string;
  monthlyPayment: number;
  totalCost: number;
  accessoriesTotal: number;
  basePayment: number;
};

const defaultAccessories: Accessory[] = [
  { code: "towbar", label: "Towbar", price: 8500 },
  { code: "canopy", label: "Canopy", price: 18500 },
  { code: "smashgrab", label: "Smash & Grab", price: 4200 },
  { code: "tracker", label: "Tracker", price: 2999 },
];

// Basic PMT (financial) calculation client-side.
// If you prefer server-side/DB calc, mirror this in SQL and fetch result.
function pmt(aprPct: number, nper: number, pv: number, fv = 0) {
  const r = (aprPct / 100) / 12;
  if (r === 0) return (pv - fv) / nper;
  return (r * (pv * Math.pow(1 + r, nper) + fv)) / (Math.pow(1 + r, nper) - 1);
}

export default function QuotingPage() {
  const sb = getSupabaseClient();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [chosen, setChosen] = useState<Vehicle | null>(null);
  const [selAccessories, setSelAccessories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [signedBusy, setSignedBusy] = useState(false);

  // Pre-set three options + EV alternative (labels must reflect Annexure style)
  const options: QuoteOption[] = useMemo(() => [
    { label: "Option 1", termMonths: 36, mileageKm: 180000, residualPct: 20, aprPct: 12.0, accessories: selAccessories },
    { label: "Option 2", termMonths: 48, mileageKm: 200000, residualPct: 25, aprPct: 12.5, accessories: selAccessories },
    { label: "Option 3", termMonths: 60, mileageKm: 240000, residualPct: 30, aprPct: 13.0, accessories: selAccessories },
    // EV alternative is computed on the first EV we can find (or same vehicle flagged as EV)
  ], [selAccessories]);

  const evAlternative = useMemo(() => {
    const ev = vehicles.find(v => v.is_ev);
    if (!ev) return null;
    return {
      label: "EV Alternative",
      vehicle: ev
    };
  }, [vehicles]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Try Supabase 'vehicles' table first, else fallback to sample
        if (sb) {
          const { data, error } = await sb.from("vehicles").select("*").limit(200);
          if (!cancelled && !error && data && data.length) {
            setVehicles(data as Vehicle[]);
            return;
          }
        }
        // Fallback (works without envs)
        setVehicles([
          { make: "Toyota", model: "Corolla Cross", derivative: "1.8 Xi", capex: 399900 },
          { make: "Ford", model: "Ranger", derivative: "2.0 XL 4x2", capex: 539900 },
          { make: "BYD", model: "Atto 3", derivative: "EV", capex: 689900, is_ev: true },
        ]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sb]);

  useEffect(() => {
    setChosen(vehicles.find(v => (v.id ?? v.mm_code ?? (v.make + v.model)) === selectedId) ?? null);
  }, [selectedId, vehicles]);

  const toggleAccessory = (code: string) => {
    setSelAccessories(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const calcFor = (vehicle: Vehicle, opt: QuoteOption): QuoteResult => {
    const accessoriesTotal = defaultAccessories.filter(a => opt.accessories.includes(a.code)).reduce((s,a)=>s+a.price,0);
    const residual = vehicle.capex * (opt.residualPct/100);
    const financed = Math.max(0, vehicle.capex + accessoriesTotal - residual);
    const basePayment = pmt(opt.aprPct, opt.termMonths, financed);
    const monthlyPayment = basePayment;
    return {
      label: opt.label,
      accessoriesTotal,
      basePayment: Number(basePayment.toFixed(2)),
      monthlyPayment: Number(monthlyPayment.toFixed(2)),
      totalCost: Number((monthlyPayment * opt.termMonths).toFixed(2))
    };
  };

  const results = useMemo(() => {
    if (!chosen) return [];
    return options.map(o => calcFor(chosen, o));
  }, [chosen, options]);

  const evResult = useMemo(() => {
    if (!evAlternative?.vehicle) return null;
    return calcFor(evAlternative.vehicle, { ...options[0], label: "EV Alternative" });
  }, [evAlternative, options]);

  const exportPDF = async () => {
    setPdfBusy(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas")
      ]);
      const node = document.getElementById("quote-sheet");
      if (!node) return;
      const canvas = await html2canvas(node, { scale: 2 });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      pdf.addImage(img, "PNG", (pageWidth - w)/2, 20, w, h);
      pdf.save(`quote_${Date.now()}.pdf`);
    } finally {
      setPdfBusy(false);
    }
  };

  const uploadSigned = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!sb) {
      alert("Supabase not configured");
      return;
    }
    setSignedBusy(true);
    try {
      const { data: { user } } = await sb.auth.getUser();
      const key = `${user?.id ?? "anon"}/${Date.now()}_${file.name.replace(/\s+/g,"_")}`;
      const { error } = await sb.storage.from("signed-quotes").upload(key, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      await sb.from("signed_quote_uploads").insert({ user_id: user?.id ?? null, path: key, filename: file.name });
      alert("Signed quotation uploaded.");
      e.currentTarget.value = "";
    } catch (err:any) {
      alert(err.message || "Upload failed");
    } finally {
      setSignedBusy(false);
    }
  };

  return (
    <div className="container-tight">
      <h1 className="text-2xl font-semibold mb-4">Electronic Quotation</h1>
      {loading ? <div>Loading…</div> : (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card p-4 space-y-3">
            <div className="text-sm text-white/70">1) Choose vehicle</div>
            <select className="input" value={selectedId} onChange={(e)=>setSelectedId(e.target.value)}>
              <option value="">Select…</option>
              {vehicles.map((v, i) => {
                const id = (v.id ?? v.mm_code ?? (v.make + v.model + i));
                return <option key={id} value={id}>{v.make} {v.model}{v.derivative?` ${v.derivative}`:""} — R{v.capex.toLocaleString()}</option>;
              })}
            </select>

            <div className="text-sm text-white/70">2) Accessories</div>
            <div className="flex flex-col gap-2">
              {defaultAccessories.map(a => (
                <label key={a.code} className="flex items-center gap-2">
                  <input type="checkbox" checked={selAccessories.includes(a.code)} onChange={()=>toggleAccessory(a.code)} />
                  <span>{a.label} (+R{a.price.toLocaleString()})</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button className="btn" onClick={exportPDF} disabled={!chosen || pdfBusy}>{pdfBusy?"Exporting…":"Export PDF"}</button>
              <label className="btn cursor-pointer">
                {signedBusy ? "Uploading…" : "Upload Signed PDF"}
                <input type="file" accept="application/pdf" className="hidden" onChange={uploadSigned} disabled={signedBusy} />
              </label>
            </div>
          </div>

          <div id="quote-sheet" className="md:col-span-2 card p-4">
            {!chosen ? (
              <div className="text-white/60">Select a vehicle to view options.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{chosen.make} {chosen.model} {chosen.derivative ?? ""}</div>
                    <div className="text-white/60 text-sm">Capex: R{chosen.capex.toLocaleString()} {selAccessories.length>0 && <>+ Accessories (R{defaultAccessories.filter(a=>selAccessories.includes(a.code)).reduce((s,a)=>s+a.price,0).toLocaleString()})</>}</div>
                  </div>
                  <div className="text-xs text-white/60">Annexure-style summary</div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {results.map(r => (
                    <div key={r.label} className="kpi">
                      <div className="text-white/70 text-sm">{r.label}</div>
                      <div className="text-xl font-semibold">R {r.monthlyPayment.toLocaleString()}</div>
                      <div className="text-white/60 text-xs">Total: R{r.totalCost.toLocaleString()}</div>
                    </div>
                  ))}
                  {evResult && (
                    <div className="kpi border border-emerald-600/40">
                      <div className="text-white/70 text-sm">EV Alternative ({evAlternative?.vehicle.make} {evAlternative?.vehicle.model})</div>
                      <div className="text-xl font-semibold">R {evResult.monthlyPayment.toLocaleString()}</div>
                      <div className="text-white/60 text-xs">Total: R{evResult.totalCost.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
