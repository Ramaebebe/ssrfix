"use client";
import { useState } from "react";

export default function Quoting() {
  const [vehicle, setVehicle] = useState("HILUX_2.4D");
  const [term, setTerm] = useState(36);
  const [km, setKm] = useState(180_000);
  const [customerName, setCustomerName] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const generatePdf = async () => {
    setBusy(true); setSignedUrl(null);
    try {
      const r = await fetch("/api/quotes/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({
          vehicle_code: vehicle,
          term_months: term,
          distance_km: km,
          accessories: [{ code: "TOWBAR", qty: 1 }, { code: "SMASHGRAB", qty: 1 }],
          customer: { name: customerName || undefined, contact: customerContact || undefined }
        })
      }).then(r => r.json());
      if (r?.pdf_signed_url) setSignedUrl(r.pdf_signed_url);
      else alert(r?.error || "Failed to generate PDF");
    } catch (e: any) {
      alert(e.message || "Failed to generate PDF");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container-tight py-6">
      <div className="card p-6 space-y-3">
        <h1 className="text-xl font-semibold">Quoting (PDF)</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Vehicle Code</label>
            <input className="input" value={vehicle} onChange={e=>setVehicle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Term (months)</label>
            <input className="input" type="number" value={term} onChange={e=>setTerm(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Contract km</label>
            <input className="input" type="number" value={km} onChange={e=>setKm(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/70">Customer (optional)</label>
            <input className="input" placeholder="Name" value={customerName} onChange={e=>setCustomerName(e.target.value)} />
            <input className="input" placeholder="Contact" value={customerContact} onChange={e=>setCustomerContact(e.target.value)} />
          </div>
        </div>

        <button className="btn" onClick={generatePdf} disabled={busy}>
          {busy ? "Generating…" : "Generate PDF"}
        </button>

        {signedUrl && (
          <div className="mt-3 text-sm">
            <a className="navlink" href={signedUrl} target="_blank" rel="noreferrer">Download / Share Quote PDF</a>
            <div className="text-white/60 mt-1">Link expires in ~1 hour.</div>
          </div>
        )}
      </div>
    </main>
  );
}
