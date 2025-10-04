"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import type { MouseEvent, TouchEvent } from "react";

// Type union for mouse and touch events used in drawing logic
type DrawingEvent = MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>;

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
  // Store the current pixel ratio to avoid recalculating it constantly
  const pixelRatioRef = useRef(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1);

  // Function to draw the initial state (background and guide line)
  const drawInitialState = useCallback((canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    const pixelRatio = pixelRatioRef.current;
    
    // Background (slate-900-ish to blend with a dark theme)
    ctx.fillStyle = "#111827"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Guide line
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2 * pixelRatio; // Scale linewidth
    ctx.beginPath();
    // Line position: 40px from the bottom in CSS pixels
    const guideLineY = canvas.height - (40 * pixelRatio); 
    ctx.moveTo(0, guideLineY);
    ctx.lineTo(canvas.width, guideLineY);
    ctx.stroke();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pixelRatio = pixelRatioRef.current;
    
    const setupCanvas = (clientWidth: number) => {
      // Set canvas display size (CSS pixels)
      const clientHeight = 160; 
      canvas.style.width = `${clientWidth}px`;
      canvas.style.height = `${clientHeight}px`;
      
      // Set canvas drawing buffer size (actual pixels)
      canvas.width = Math.min(800, clientWidth * pixelRatio);
      canvas.height = clientHeight * pixelRatio;
    };
    
    // Initial setup
    setupCanvas(canvas.clientWidth);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    // Draw the initial state
    drawInitialState(canvas, ctx);

    // Resize observer to handle container resize dynamically
    let currentClientWidth = canvas.clientWidth;
    const resizeObserver = new ResizeObserver(() => {
        const newClientWidth = canvas.clientWidth;
        if (newClientWidth !== currentClientWidth) {
            currentClientWidth = newClientWidth;
            setupCanvas(newClientWidth);
            drawInitialState(canvas, ctx);
            
            // NOTE: If you wanted to preserve a drawn signature on resize, 
            // you would need to store the path points and redraw them here. 
            // Since this component only stores the final dataURL in 'value', 
            // we simply clear the current drawing and maintain the guide.
        }
    });

    resizeObserver.observe(canvas);

    return () => resizeObserver.unobserve(canvas);
  }, [drawInitialState]); // Depend on drawInitialState

  // Helper function to get drawing position, accounting for scaling
  const getPos = (e: DrawingEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    
    // Scale factors from CSS pixels to canvas drawing buffer pixels
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;

    if ("touches" in e && e.touches.length > 0) {
      // Touch event
      const t = e.touches[0];
      clientX = t.clientX;
      clientY = t.clientY;
    } else if ("clientX" in e) {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
        return { x: 0, y: 0 }; 
    }
    
    // Calculate position in canvas buffer coordinates
    return { 
        x: (clientX - rect.left) * scaleX, 
        y: (clientY - rect.top) * scaleY 
    };
  };

  const start = (e: DrawingEvent) => {
    e.preventDefault();
    drawingRef.current = true;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const p = getPos(e);
    
    // Set drawing style
    const pixelRatio = pixelRatioRef.current;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3 * pixelRatio; // Scale linewidth
    ctx.lineCap = "round";
    
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e: DrawingEvent) => {
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
    
    // Save as a PNG data URL
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
    // Note: ctx.closePath() is optional here as it doesn't affect the stroke appearance
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    
    // Redraw initial state
    drawInitialState(canvas, ctx);

    onChange(""); // Clear the value
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
          // The CSS height should match the clientHeight used in useEffect (160px)
          className="w-full h-[160px] touch-none" 
          // Mouse handlers
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          // Touch handlers
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>

      {/* Renders the current saved signature (value) as an image preview */}
      {value && (
        <div className="mt-2">
          <Image
            src={value}
            alt="Signature preview"
            // Use concrete dimensions for the Image component
            width={320} 
            height={160}
            className="rounded border border-white/10"
            // CRITICAL FIX: unoptimized is needed for data URLs to work with Next/Image
            unoptimized 
          />
        </div>
      )}
    </div>
  );
}