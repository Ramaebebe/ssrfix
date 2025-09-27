"use client";
import { useRef, useEffect } from "react";
import SignaturePadLib from "signature_pad";

type Props = { onSave: (dataUrl: string) => void };

export default function SignaturePad({ onSave }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePadLib | null>(null);

  useEffect(() => {
    if (canvasRef.current) padRef.current = new SignaturePadLib(canvasRef.current);
  }, []);

  const handleSave = () => {
    if (padRef.current && !padRef.current.isEmpty()) {
      onSave(padRef.current.toDataURL());
    }
  };

  return (
    <div className="card p-4 space-y-2">
      <h2 className="text-lg font-semibold">Digital Signature</h2>
      <canvas ref={canvasRef} width={400} height={200} className="border border-white/20 bg-white" />
      <div className="flex gap-2">
        <button className="btn" onClick={handleSave}>Save</button>
        <button className="btn" onClick={() => padRef.current?.clear()}>Clear</button>
      </div>
    </div>
  );
}
