"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export type SignaturePadProps = {
  /** Current signature value; accepts a data URL or remote URL for preview */
  value: string;
  /** Called when a new signature is produced (data URL) or cleared */
  onChange: (dataUrl: string) => void;
};

export default function SignaturePad({ value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = Math.min(800, canvas.clientWidth * window.devicePixelRatio);
    canvas.height = 200 * window.devicePixelRatio;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    // background
    ctx.fillStyle = "#111827"; // slate-900-ish to blend dark theme
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // guide line
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 40);
    ctx.lineTo(canvas.width, canvas.height - 40);
    ctx.stroke();

    // existing value (if any) is just shown below as an <img> preview
  }, []);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e && e.touches.length > 0) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    } else if ("clientX" in e) {
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }
    return { x: 0, y: 0 };
  };

  const start = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawingRef.current = true;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const p = getPos(e);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = ctxRef.current;
    if (!ctx) return;
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 40);
    ctx.lineTo(canvas.width, canvas.height - 40);
    ctx.stroke();

    onChange("");
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/70">Digital signature</div>
        <button type="button" className="btn" onClick={clear}>Clear</button>
      </div>

      <div className="rounded-lg overflow-hidden border border-white/10 bg-black/30">
        <canvas
          ref={canvasRef}
          className="w-full h-40 touch-none"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>

      {preview && (
        <div className="mt-3">
           <Image
              src={preview}
              alt="Signature preview"
              width={400}
              height={120}
              className="rounded border border-white/10"
            />
        </div>
      )}
      
      {value ? (
        <div className="space-y-1">
          <div className="text-xs text-white/60">Preview</div>
          <img
            src={value}
            alt="Signature preview"
            className="max-h-24 rounded border border-white/10"
          />
        </div>
      ) : null}
    </div>
  );
}
