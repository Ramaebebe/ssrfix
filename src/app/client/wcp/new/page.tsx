"use client";
import { useState } from "react";
import Scanner from "@/components/wcp/Scanner";
import ChecklistForm from "@/components/wcp/ChecklistForm";
import SignaturePad from "@/components/wcp/SignaturePad";

export default function NewWCPAssessment() {
  const [vehicle, setVehicle] = useState<any>(null);
  const [checklist, setChecklist] = useState<any[]>([]);
  const [signature, setSignature] = useState<string|null>(null);

  const handleSubmit = async () => {
    const res = await fetch("/api/wcp/assessments", {
      method: "POST",
      body: JSON.stringify({ vehicle, checklist, signature }),
    });
    if (res.ok) alert("Assessment submitted!");
    else alert("Failed to submit");
  };

  return (
    <div className="p-4 space-y-4">
      {!vehicle && <Scanner onDetected={(data) => setVehicle(data)} />}
      {vehicle && (
        <>
          <ChecklistForm value={checklist} onChange={setChecklist} />
          <SignaturePad onSave={setSignature} />
          <button className="btn" onClick={handleSubmit}>Submit Assessment</button>
        </>
      )}
    </div>
  );
}
