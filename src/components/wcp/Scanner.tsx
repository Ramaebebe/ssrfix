"use client";
import { useEffect } from "react";

type ScannerProps = {
  onDetected: (vehicle: { id: string; reg: string; vin: string }) => void;
};

export default function Scanner({ onDetected }: ScannerProps) {
  useEffect(() => {
    // Demo: simulate scan in 1.5s
    const t = setTimeout(() => {
      onDetected({ id: crypto.randomUUID(), reg: "FZC504L", vin: "VIN1234567890" });
    }, 1500);
    return () => clearTimeout(t);
  }, [onDetected]);

  return (
    <div className="card p-6 text-center">
      <p className="text-white/70 mb-2">📷 License Disc Scanner</p>
      <p className="text-xs text-white/50">(Demo mode — fills sample data)</p>
    </div>
  );
}
