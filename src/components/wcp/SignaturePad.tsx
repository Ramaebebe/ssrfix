"use client";
import { useRef } from "react";
export default function SignaturePad({ onChange }:{onChange:(dataUrl:string)=>void}){
  const ref=useRef<HTMLCanvasElement>(null);
  return (
    <div className="card p-4">
      <div className="font-semibold mb-2">Signature</div>
      <canvas ref={ref} className="bg-white w-full h-40 rounded" />
      <button className="btn mt-2" onClick={()=>onChange(ref.current?.toDataURL() || "")}>Save Signature</button>
    </div>
  );
}
