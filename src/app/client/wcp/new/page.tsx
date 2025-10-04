// src/app/client/wcp/new/page.tsx
"use client";

import { useState } from "react";
import Scanner from "@/components/wcp/Scanner";
import ChecklistForm from "@/components/wcp/ChecklistForm";
import SignaturePad from "@/components/wcp/SignaturePad";
import { supabase } from "@/lib/supabase/client";

type Status = "Pass" | "Fail" | "N/A";

export type ChecklistItem = {
  category: string;
  field: string;
  status: Status;
  notes?: string;
};

type VehicleRow = {
  id: string;
  reg: string | null;
  vin: string | null;
};

export default function NewAssessmentPage() {
  const [vehicleCode, setVehicleCode] = useState<string>("");
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [signatureUrl, setSignatureUrl] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  const submit = async () => {
    if (!vehicleCode) {
      alert("Scan or enter a vehicle registration first.");
      return;
    }
    if (!signatureUrl) {
      // Optional — enforce signature before submit
      const proceed = confirm("No signature captured. Submit anyway?");
      if (!proceed) return;
    }

    setSaving(true);
    try {
      // TODO: If your tables are namespaced, replace with .from("portal.vehicles")
      const { data: vehicle, error: vErr } = await supabase
        .from("vehicles")
        .select<"id, reg, vin", VehicleRow>("id, reg, vin")
        .eq("reg", vehicleCode)
        .maybeSingle();

      if (vErr) throw vErr;
      if (!vehicle) {
        alert("Vehicle not found.");
        return;
      }

      // Insert parent assessment (schema: wcp_assessments)
      // If namespaced: .from("portal.wcp_assessments")
      const { data: assessment, error: aErr } = await supabase
        .from("wcp_assessments")
        .insert({
          vehicle_id: vehicle.id,
          signature_url: signatureUrl || null,
        })
        .select("id")
        .single<{ id: string }>();

      if (aErr) throw aErr;

      // Insert child items if provided
      if (items.length) {
        // If namespaced: .from("portal.wcp_assessment_items")
        const toInsert = items.map((i) => ({
          assessment_id: assessment.id,
          category: i.category,
          field: i.field,
          status: i.status,
          notes: i.notes ?? null,
        }));

        const { error: iErr } = await supabase
          .from("wcp_assessment_items")
          .insert(toInsert);

        if (iErr) throw iErr;
      }

      alert("Assessment saved.");
      setVehicleCode("");
      setItems([]);
      setSignatureUrl("");
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "Failed to save assessment. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="container-tight space-y-6">
      <h1 className="text-2xl font-semibold">New Assessment</h1>

      {/* Scanner populates the registration (or code) */}
      <Scanner onDetected={(text: string) => setVehicleCode(text.toUpperCase())} />

      {/* Manual entry/edit fallback */}
      <div className="space-y-2">
        <label className="text-sm text-white/70">Registration</label>
        <input
          className="input"
          placeholder="e.g. FZC504L"
          value={vehicleCode}
          onChange={(e) => setVehicleCode(e.target.value.toUpperCase())}
        />
      </div>

      {/* Checklist */}
      <ChecklistForm
        value={items}
        onChange={(next: ChecklistItem[]) => setItems(next)}
      />

      {/* Signature */}
      <SignaturePad
        value={signatureUrl}
        onChange={(url: string) => setSignatureUrl(url)}
      />

      <button className="btn" onClick={submit} disabled={saving}>
        {saving ? "Saving…" : "Submit"}
      </button>
    </main>
  );
}
