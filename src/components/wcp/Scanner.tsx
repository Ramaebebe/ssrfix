"use client";

import { useId } from "react";

export type ScannerProps = {
  /** Called when a code/registration is detected or typed */
  onDetected: (text: string) => void;
};

export default function Scanner({ onDetected }: ScannerProps) {
  const id = useId();

  // Minimal keyboard fallback. Replace with camera-based scanning later.
  return (
    <div className="card p-4 space-y-2">
      <div className="text-sm text-white/70">Scanner (temporary input)</div>
      <input
        id={`scanner-${id}`}
        className="input"
        placeholder="Type or scan registration (e.g. FZC504L)"
        onChange={(e) => onDetected(e.target.value)}
      />
      <div className="text-xs text-white/50">
        Tip: Integrate PDF417 scanning later; this keeps UX unblocked.
      </div>
    </div>
  );
}
