"use client";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

type Uploading = { name: string; progress: number; done?: boolean; error?: string };

export default function NewAuditPage() {
  const [vehicleReg, setVehicleReg] = useState("");
  const [notes, setNotes] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<Uploading[]>([]);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 8000 }
    );
  }, []);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = Array.from(e.target.files || []);
    setFiles(f.slice(0, 12)); // cap to 12 photos
  };

  const onSubmit = async () => {
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Your session expired. Please sign in again.");
        window.location.href = "/login";
        return;
      }

      const userId = session.user.id;
      const tenantId = (session.user.user_metadata?.tenant_id) || null;

      // 1) Upload photos to Storage (private bucket: audit-photos)
      const uploadedPaths: string[] = [];
      setUploading(files.map(f => ({ name: f.name, progress: 0 })));

      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const path = `${userId}/${Date.now()}-${i}-${f.name.replace(/\s+/g, "_")}`;
        const { data, error } = await supabase.storage.from("audit-photos").upload(path, f, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) {
          setUploading(prev => prev.map(u => u.name === f.name ? ({ ...u, error: error.message }) : u));
          throw error;
        }
        uploadedPaths.push(data.path);
        setUploading(prev => prev.map((u, idx) => idx === i ? ({ ...u, progress: 100, done: true }) : u));
      }

      // 2) Create audit via API route (server inserts DB rows)
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleReg,
          notes,
          lat,
          lng,
          photoPaths: uploadedPaths,
          tenant_id: tenantId,
          user_id: userId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create audit");

      setCreatedId(json.id);
    } catch (e: any) {
      alert(e.message || "Unexpected error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">New Vehicle Audit</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4 space-y-3">
          <div>
            <label className="block text-sm mb-1 text-white/80">Vehicle Registration</label>
            <input className="input" value={vehicleReg} onChange={e=>setVehicleReg(e.target.value)} placeholder="e.g. FZC504L" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-white/80">Notes</label>
            <textarea className="input h-28" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Observed defects, tyres, body, etc." />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="text-xs text-white/60">Latitude</div>
              <div className="font-mono">{lat ?? "…"}</div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-white/60">Longitude</div>
              <div className="font-mono">{lng ?? "…"}</div>
            </div>
          </div>
        </div>

        <div className="card p-4 space-y-3">
          <div>
            <label className="block text-sm mb-1 text-white/80">Photos (up to 12)</label>
            <input type="file" multiple accept="image/*" onChange={onSelect} />
          </div>
          <div className="space-y-2">
            {uploading.map((u,i)=>(
              <div key={i} className="text-xs">
                <div className="flex justify-between">
                  <span>{u.name}</span>
                  <span>{u.error ? "error" : `${u.progress}%`}</span>
                </div>
                <div className="h-1 bg-white/10 rounded">
                  <div className={`h-1 ${u.error ? "bg-red-500" : "bg-white/70"}`} style={{width:`${u.progress}%`}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="btn" onClick={onSubmit} disabled={busy || !vehicleReg}>
          {busy ? "Saving…" : "Save Audit"}
        </button>
        {createdId && (
          <a className="navlink" href={`/api/audits/report/${createdId}`} target="_blank" rel="noreferrer">
            Open Report PDF
          </a>
        )}
      </div>
    </div>
  );
}
