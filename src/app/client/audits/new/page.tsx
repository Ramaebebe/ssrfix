"use client";

import { useState } from "react";
import supabase from "@/lib/supabaseClient";

export default function NewAuditPage() {
  const [reg, setReg] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { data: user } = await supabase.auth.getUser();
    const id = crypto.randomUUID();
    await supabase.from("vehicle_audits").insert({
      id, reg, user_id: user.user?.id ?? null,
    });
    if (files && files.length) {
      for (const f of Array.from(files)) {
        await supabase.storage.from("audits").upload(`${id}/${f.name}`, f, { upsert: true });
      }
    }
    setSaving(false);
    alert("Saved");
  };

  return (
    <div className="container-tight">
      <h1 className="text-xl font-semibold mb-4">New Audit</h1>
      <input className="input mb-3" placeholder="Vehicle Reg" value={reg} onChange={e=>setReg(e.target.value)} />
      <input className="mb-3" type="file" multiple onChange={e=>setFiles(e.target.files)} />
      <button className="btn" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</button>
    </div>
  );
}
