// src/app/client/audits/page.tsx
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";

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
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
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
    // If you have an RPC, use it; else, select with a left join count
    const { data, error } = await sb
      .from("audit_inspections")
      .select("*, photo_count:audit_photos(count)")
      .order("created_at", { ascending: false })
      .limit(500);

    if (!error && data) {
      const normalized = data.map((r: any) => ({
        id: r.id,
        reg: r.reg,
        odometer: r.odometer,
        condition: r.condition,
        issues: r.issues,
        lat: r.lat,
        lng: r.lng,
        created_at: r.created_at,
        photo_count: Array.isArray(r.photo_count) ? r.photo_count[0]?.count ?? 0 : 0,
      })) as Inspection[];
      setRows(normalized);
    }
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
      const { data: inserted, error } = await sb
        .from("audit_inspections")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      const inspId = inserted.id as string;

      if (files && files.length) {
        for (const file of Array.from(files)) {
          const path = `${inspId}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
          const up = await sb.storage
            .from("audit-photos")
            .upload(path, file, { upsert: false, contentType: file.type });
          if (up.error) throw up.error;
          await sb.from("audit_photos").insert({ inspection_id: inspId, path, filename: file.name });
        }
      }
      setReg(""); setOdo(""); setIssues(""); setFiles(null);
      await loadRows();
      alert("Inspection saved.");
    } catch (err: any) {
      alert(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
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
