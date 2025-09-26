"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { getSupabaseClient } from "@/lib/supabaseClient";

type Inspection = {
  id: string;
  reg: string;
  odometer: number | null;
  condition: string;
  issues: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  photo_count?: number;
};

export default function AuditsPage() {
  const sb = getSupabaseClient();
  const [reg, setReg] = useState("");
  const [odo, setOdo] = useState<number | "">("");
  const [condition, setCondition] = useState("Good");
  const [issues, setIssues] = useState("");
  const [coords, setCoords] = useState<{ lat:number; lng:number }|null>(null);
  const [files, setFiles] = useState<FileList|null>(null);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => setCoords(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const loadRows = async () => {
    if (!sb) { setLoading(false); return; }
    const { data, error } = await sb.rpc("list_inspections_with_counts"); // defined in SQL below
    if (!error && data) setRows(data as unknown as Inspection[]);
    setLoading(false);
  };

  useEffect(() => { loadRows(); }, []); // eslint-disable-line

  const save = async () => {
    if (!sb) return alert("Supabase not configured");
    if (!reg) return alert("Registration is required");
    setSaving(true);
    try {
      const payload = {
        reg,
        odometer: odo === "" ? null : Number(odo),
        condition,
        issues: issues || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      };
      const { data: inserted, error } = await sb.from("audit_inspections").insert(payload).select("*").single();
      if (error) throw error;
      const inspId = inserted.id as string;

      if (files && files.length) {
        for (const file of Array.from(files)) {
          const path = `${inspId}/${Date.now()}_${file.name.replace(/\s+/g,"_")}`;
          const up = await sb.storage.from("audit-photos").upload(path, file, { upsert: false, contentType: file.type });
          if (up.error) throw up.error;
          await sb.from("audit_photos").insert({ inspection_id: inspId, path, filename: file.name });
        }
      }
      setReg(""); setOdo(""); setIssues(""); setFiles(null);
      await loadRows();
      alert("Inspection saved.");
    } catch (err:any) {
      alert(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const exportPDF = async () => {
    const node = tableRef.current;
    if (!node) return;
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas")
    ]);
    const canvas = await html2canvas(node, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    pdf.addImage(img, "PNG", (pageWidth - w)/2, 20, w, h);
    pdf.save(`vehicle_audits_${Date.now()}.pdf`);
  };

  return (
    <div className="container-tight">
      <h1 className="text-2xl font-semibold mb-4">Maintenance & Technical Audits</h1>

      <div className="card p-4 mb-4 grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-white/70">Registration</label>
          <input className="input" value={reg} onChange={(e)=>setReg(e.target.value.toUpperCase())} placeholder="e.g. FZC504L" />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Odometer (km)</label>
          <input className="input" type="number" value={odo} onChange={(e)=>setOdo(e.target.value===""? "" : Number(e.target.value))} placeholder="e.g. 125000" />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Condition</label>
          <select className="input" value={condition} onChange={(e)=>setCondition(e.target.value)}>
            <option>Good</option>
            <option>Fair</option>
            <option>Poor</option>
          </select>
        </div>
        <div className="md:col-span-3 space-y-2">
          <label className="text-sm text-white/70">Issues (optional)</label>
          <textarea className="input" rows={3} value={issues} onChange={(e)=>setIssues(e.target.value)} placeholder="Notes on defects, tyres, bodywork, etc." />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-white/70">Photos</label>
          <input className="input" type="file" accept="image/*" multiple onChange={(e)=>setFiles(e.target.files)} />
          <div className="text-xs text-white/50">Geolocation: {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "Not available"}</div>
        </div>
        <div className="flex items-end">
          <button className="btn" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Inspection"}</button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="text-white/70 text-sm">{rows.length} inspections</div>
        <button className="btn" onClick={exportPDF}>Export PDF</button>
      </div>

      <div ref={tableRef} className="card p-4 overflow-x-auto">
        {loading ? "Loading…" : (
          <table className="w-full text-sm">
            <thead className="text-white/70">
              <tr>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Reg</th>
                <th className="text-right p-2">Odometer</th>
                <th className="text-left p-2">Condition</th>
                <th className="text-left p-2">Issues</th>
                <th className="text-left p-2">Location</th>
                <th className="text-right p-2">Photos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-2">{r.reg}</td>
                  <td className="p-2 text-right">{r.odometer?.toLocaleString() ?? "-"}</td>
                  <td className="p-2">{r.condition}</td>
                  <td className="p-2">{r.issues ?? "-"}</td>
                  <td className="p-2">{(r.lat && r.lng) ? `${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}` : "-"}</td>
                  <td className="p-2 text-right">{r.photo_count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
