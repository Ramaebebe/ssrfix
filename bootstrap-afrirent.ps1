# ================================
# bootstrap-afrirent.ps1
# Creates/overwrites files for the Afrirent Portal baseline
# ================================

$ErrorActionPreference = "Stop"

function Write-File($Path, $Content) {
  $dir = Split-Path $Path -Parent
  if (!(Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
  Write-Host "Wrote $Path"
}

# --- Root files ---
Write-File "package.json" @'
{
  "name": "afrirent-portal",
  "version": "0.5.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@supabase/auth-helpers-nextjs": "0.10.7",
    "@supabase/supabase-js": "2.45.4",
    "ag-grid-community": "32.3.3",
    "ag-grid-react": "32.3.3",
    "html2canvas": "1.4.1",
    "jspdf": "2.5.1",
    "next": "14.2.15",
    "pdf-lib": "1.17.1",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "recharts": "2.12.7",
    "tailwindcss": "3.4.10",
    "xlsx": "0.18.5"
  },
  "devDependencies": {
    "@types/node": "20.14.12",
    "@types/react": "18.3.5",
    "@types/react-dom": "18.3.0",
    "autoprefixer": "10.4.20",
    "postcss": "8.4.47",
    "typescript": "5.6.2"
  }
}
'@

Write-File "tsconfig.json" @'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom","dom.iterable","es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "types": ["node"],
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts","src/**/*",".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
'@

Write-File "next.config.mjs" @'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "5mb" }
  }
};
export default nextConfig;
'@

Write-File "postcss.config.js" @'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
'@

Write-File "tailwind.config.ts" @'
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#EC6425"
      }
    }
  },
  plugins: []
} satisfies Config;
'@

Write-File ".env.example" @'
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
'@

# --- public assets ---
New-Item -ItemType Directory -Force -Path "public/brand" | Out-Null
# Create a tiny placeholder PNG so build doesn't fail if you forget to add your logo
[byte[]]$png = 137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,32,0,0,0,32,8,6,0,0,0,115,122,122,244,0,0,0,10,73,68,65,84,120,156,99,96,24,5,163,96,0,0,0,62,0,1,209,60,7,28,0,0,0,0,73,69,78,68,174,66,96,130
[IO.File]::WriteAllBytes("public/brand/afrirent_logo.png", $png)

# --- styles ---
Write-File "src/styles/globals.css" @'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: dark; }
body { @apply bg-neutral-950 text-white; }

.container-tight { @apply max-w-6xl mx-auto px-4; }
.card { @apply bg-white/5 rounded-lg border border-white/10; }
.btn { @apply px-3 py-2 rounded bg-brand text-white hover:bg-orange-600 transition; }
.navlink { @apply px-3 py-2 rounded border border-white/20 hover:bg-white/10; }
.input { @apply bg-white/10 border border-white/20 rounded px-3 py-2 w-full; }
.watermark { background-image: radial-gradient(transparent 60%, rgba(255,255,255,0.02) 60%); background-size: 6px 6px; }
'@

# --- supabase types ---
Write-File "src/types/supabase.ts" @'
export type Database = any; // replace with generated types when ready
'@

# --- supabase client/server ---
Write-File "src/lib/supabaseClient.ts" @'
"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error("Missing Supabase env (URL/ANON_KEY).");
  _client = createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } });
  return _client;
}
export const supabase = getSupabaseClient();
export default getSupabaseClient;
'@

Write-File "src/lib/supabase/server.ts" @'
import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createRouteHandlerClient
} from "@supabase/auth-helpers-nextjs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export function getServerSupabase() {
  return createServerComponentClient<Database>({ cookies });
}
export function getRouteSupabase() {
  return createRouteHandlerClient<Database>({ cookies });
}
export function getServiceSupabase(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing service role env.");
  return createClient<Database>(url, key);
}
'@

# --- PDF brand & template ---
Write-File "src/lib/pdf/brand.ts" @'
export const BRAND = {
  company: "Afrirent Holdings",
  logoPath: "/brand/afrirent_logo.png",
  primary: [0.925, 0.392, 0.145] as const
};
'@

Write-File "src/lib/pdf/auditTemplate.ts" @'
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { BRAND } from "./brand";

export type AuditPdfInput = {
  id: string;
  date: string;
  inspector: string;
  vehicle: { reg?: string; vin?: string; make?: string; model?: string };
  location: string;
  findings: string;
  notes: string;
  photos: { filename: string; bytes: Uint8Array }[];
};

export async function buildAuditPdf(input: AuditPdfInput, logoBytes?: Uint8Array) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const text = rgb(0.95, 0.95, 0.95);
  const muted = rgb(0.7, 0.7, 0.7);
  const brand = rgb(...BRAND.primary);

  if (logoBytes && logoBytes.length > 0) {
    try {
      let img;
      try { img = await pdf.embedPng(logoBytes); } catch { img = await pdf.embedJpg(logoBytes); }
      const w = 90;
      const h = (img.height / img.width) * w;
      page.drawImage(img, { x: 40, y: 780, width: w, height: h });
    } catch {}
  }
  page.drawText(BRAND.company, { x: 140, y: 800, size: 16, font, color: text });
  page.drawText("Vehicle Audit Report", { x: 140, y: 780, size: 12, font, color: brand });

  const metaY = 740;
  page.drawText(`Audit ID: ${input.id}`, { x: 40, y: metaY, size: 10, font, color: muted });
  page.drawText(`Date: ${new Date(input.date).toLocaleString()}`, { x: 300, y: metaY, size: 10, font, color: muted });

  let y = 710;
  const lines = [
    `Registration: ${input.vehicle.reg || "-"}`,
    `VIN: ${input.vehicle.vin || "-"}`,
    `Make/Model: ${(input.vehicle.make || "-") + " " + (input.vehicle.model || "")}`.trim(),
    `Location: ${input.location || "-"}`,
    `Inspector: ${input.inspector || "-"}`,
  ];
  for (const l of lines) { page.drawText(l, { x: 40, y, size: 11, font, color: text }); y -= 16; }

  y -= 8;
  page.drawText("Findings:", { x: 40, y, size: 12, font, color: brand }); y -= 16;
  for (const l of input.findings.split("\n")) { page.drawText(l, { x: 40, y, size: 10, font, color: text }); y -= 14; if (y < 120) { pdf.addPage([595.28, 841.89]); break; } }

  let pageIdx = 0;
  let x = 40, rowH = 0;
  const maxW = 515;
  const marginBottom = 60;
  y -= 10;
  page.drawText("Photos:", { x: 40, y, size: 12, font, color: brand }); y -= 16;

  const ensureSpace = () => {
    if (y < marginBottom + 120) {
      const newPage = pdf.addPage([595.28, 841.89]);
      pageIdx += 1;
      return newPage;
    }
    return page;
  };

  let currentPage = page;
  for (const p of input.photos) {
    let img;
    try { img = await pdf.embedPng(p.bytes); } catch { img = await pdf.embedJpg(p.bytes); }
    const scale = 120 / img.width;
    const w = img.width * scale;
    const h = img.height * scale;
    if (x + w > (40 + maxW)) { x = 40; y -= (rowH + 18); rowH = 0; }
    if (y - h < marginBottom) { currentPage = ensureSpace(); y = 780; x = 40; rowH = 0; }
    currentPage.drawImage(img, { x, y: y - h, width: w, height: h });
    currentPage.drawText(p.filename, { x, y: y - h - 12, size: 9, font, color: muted });
    rowH = Math.max(rowH, h);
    x += w + 12;
  }

  return pdf.save();
}
'@

# --- components ---
Write-File "src/components/Topbar.tsx" @'
"use client";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

const Topbar = () => {
  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  return (
    <header className="card px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Image src="/brand/afrirent_logo.png" alt="Afrirent" width={32} height={32} />
        <span className="font-semibold">Afrirent Portal</span>
      </div>
      <button className="navlink" onClick={signOut}>Sign out</button>
    </header>
  );
};
export default Topbar;
'@

Write-File "src/components/ClientGuard.tsx" @'
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ClientGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) window.location.href = "/login";
      else setReady(true);
    });
  }, []);
  if (!ready) return null;
  return <>{children}</>;
}
'@

# --- WCP stubs ---
Write-File "src/components/wcp/PowerBIEmbed.tsx" @'
"use client";
import { useEffect, useRef } from "react";
type Props = { reportId: string; embedUrl: string; accessToken: string; };
export default function PowerBIEmbed({ reportId, embedUrl, accessToken }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.innerText = embedUrl ? `Power BI: ${reportId}` : "Power BI (configure token)";
  }, [reportId, embedUrl, accessToken]);
  return <div ref={ref} className="card p-4 h-64" />;
}
'@

Write-File "src/components/wcp/Scanner.tsx" @'
"use client";
type ScanResult = { vin?: string; reg?: string };
export default function Scanner({ onFound }: { onFound: (r: ScanResult)=>void }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-white/70 mb-2">Scanner (stub) — click to simulate</div>
      <button className="btn" onClick={()=>onFound({ vin: "VF3ABC12345678901", reg: "ABC123GP" })}>
        Simulate License Disc Scan
      </button>
    </div>
  );
}
'@

Write-File "src/components/wcp/ChecklistForm.tsx" @'
"use client";
import { useState } from "react";
export default function ChecklistForm({ vin, reg, onSubmit }: { vin?: string; reg?: string; onSubmit: ()=>void }) {
  const [status, setStatus] = useState("Pass");
  const [notes, setNotes] = useState("");
  return (
    <div className="card p-4 space-y-3">
      <div className="text-sm text-white/70">VIN: {vin || "-"}</div>
      <div className="text-sm text-white/70">Reg: {reg || "-"}</div>
      <div>
        <label className="text-sm">Overall</label>
        <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
          <option>Pass</option><option>Fail</option>
        </select>
      </div>
      <textarea className="input" rows={3} placeholder="Notes…" value={notes} onChange={e=>setNotes(e.target.value)} />
      <button className="btn" onClick={onSubmit}>Submit</button>
    </div>
  );
}
'@

Write-File "src/components/wcp/SignaturePad.tsx" @'
"use client";
export default function SignaturePad({ onDone }: { onDone: ()=>void }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-white/70 mb-2">Signature (stub)</div>
      <button className="btn" onClick={onDone}>Complete Signature</button>
    </div>
  );
}
'@

# --- app/layouts/pages ---
Write-File "src/app/layout.tsx" @'
import "./../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Afrirent Portal",
  description: "Operational portal"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>{children}</body></html>
  );
}
'@

Write-File "src/app/page.tsx" @'
export default function Home() {
  return (
    <main className="container-tight py-10">
      <h1 className="text-3xl font-bold mb-4">Afrirent Portal</h1>
      <a className="btn" href="/login">Sign in</a>
    </main>
  );
}
'@

Write-File "src/app/login/page.tsx" @'
"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
export const dynamic = "force-dynamic";
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const sendMagic = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo }});
    if (error) alert(error.message);
    else setSent(true);
  };
  return (
    <main className="container-tight py-10">
      <div className="card p-6 max-w-md">
        <h1 className="text-xl font-semibold mb-4">Sign in</h1>
        <input className="input mb-3" placeholder="you@company.com" value={email} onChange={e=>setEmail(e.target.value)} />
        <button className="btn w-full" onClick={sendMagic} disabled={!email}>Send magic link</button>
        {sent && <p className="text-sm text-white/70 mt-3">Check your inbox.</p>}
      </div>
    </main>
  );
}
'@

Write-File "src/app/auth/callback/page.tsx" @'
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
export default function Callback() {
  const router = useRouter();
  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) return router.replace("/client");
      await supabase.auth.exchangeCodeForSession(location.href).catch(()=>{});
      const again = await supabase.auth.getSession();
      if (again.data.session) router.replace("/client");
      else router.replace("/login?error=auth_failed");
    };
    run();
  }, [router]);
  return <main className="container-tight py-10">Signing you in…</main>;
}
'@

Write-File "src/app/client/layout.tsx" @'
import Topbar from "@/components/Topbar";
import ClientGuard from "@/components/ClientGuard";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientGuard>
      <main className="container-tight py-6">
        <Topbar />
        <div className="mt-6">{children}</div>
      </main>
    </ClientGuard>
  );
}
'@

Write-File "src/app/client/page.tsx" @'
export default function ClientHome() {
  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold">Welcome</h1>
      <div className="mt-4 flex gap-3 flex-wrap">
        <a className="navlink" href="/client/reports">Reports</a>
        <a className="navlink" href="/client/audits">Audits</a>
        <a className="navlink" href="/client/wcp">Waste Compactor Module</a>
      </div>
    </div>
  );
}
'@

Write-File "src/app/client/reports/page.tsx" @'
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { AgGridReact } from "ag-grid-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getSupabaseClient } from "@/lib/supabaseClient";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

type Tile = { section: string; title: string; value: number; unit?: string; delta?: number; spark?: number[]; };
type Txn = { section: string; title: string; ts: string; ref?: string; description?: string; amount?: number; entity?: string; };

export default function ReportsPage() {
  const sb = getSupabaseClient();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);

  useEffect(() => {
    (async () => {
      const { data: t } = await sb.from("report_tiles").select("*").limit(100);
      const { data: d } = await sb.from("report_transactions").select("*").order("ts", { ascending: false }).limit(200);
      setTiles((t || []) as Tile[]);
      setTxns((d || []) as Txn[]);
    })();
  }, [sb]);

  const grouped = useMemo(() => {
    const m = new Map<string, Tile[]>();
    for (const t of tiles) { if (!m.has(t.section)) m.set(t.section, []); m.get(t.section)!.push(t); }
    return Array.from(m.entries());
  }, [tiles]);

  const txByKey = useMemo(() => {
    const m = new Map<string, Txn[]>();
    for (const r of txns) {
      const key = `${r.section}|||${r.title}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    }
    for (const [, arr] of m) arr.sort((a,b)=> a.ts > b.ts ? -1 : 1);
    return m;
  }, [txns]);

  const onExportPDF = async () => {
    const node = pdfRef.current; if (!node) return;
    const canvas = await html2canvas(node, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
    const w = pdf.internal.pageSize.getWidth(), h = pdf.internal.pageSize.getHeight();
    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save("Afrirent_Reports.pdf");
  };

  const columns = [
    { headerName: "Date", field: "ts", valueFormatter: (p: any) => new Date(p.value).toLocaleDateString() },
    { headerName: "Ref", field: "ref" },
    { headerName: "Description", field: "description", flex: 1 },
    { headerName: "Amount", field: "amount", valueFormatter: (p: any) => (p.value != null ? `R ${Number(p.value).toLocaleString()}` : "") },
    { headerName: "Entity", field: "entity" },
  ];

  return (
    <main>
      <div className="card p-5 mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-semibold mr-auto">Reports</h1>
        <button className="btn" onClick={onExportPDF}>Export PDF</button>
      </div>

      <div ref={pdfRef} className="space-y-8">
        {grouped.map(([section, items]) => (
          <section key={section}>
            <div className="flex items-center gap-3 mb-3">
              <img src="/brand/afrirent_logo.png" className="h-6 opacity-80" alt="" />
              <h2 className="text-xl font-semibold">{section}</h2>
              <div className="h-px flex-1 bg-white/10"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {items.slice(0, 3).map((tile, i) => {
                const key = `${tile.section}|||${tile.title}`;
                const rows = (txByKey.get(key) ?? []).slice(0, 20);
                return (
                  <div key={i} className="card p-5 watermark">
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="text-sm text-white/70">{tile.title}</div>
                      {tile.delta !== undefined && (
                        <div className={tile.delta >= 0 ? "text-green-400 text-xs" : "text-red-400 text-xs"}>
                          {tile.delta >= 0 ? "+" : ""}{tile.delta}
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      {(tile.unit === "R" ? "R " : "") + tile.value.toLocaleString()} {tile.unit && tile.unit !== "R" ? tile.unit : ""}
                    </div>
                    <div className="h-24 mb-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={(tile.spark ?? []).map((v, idx) => ({ i: idx, v }))}>
                          <Line type="monotone" dataKey="v" stroke="#EC6425" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="ag-theme-alpine" style={{ height: 260 }}>
                      <AgGridReact rowData={rows as any} columnDefs={columns as any} headerHeight={28} rowHeight={28} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
'@

Write-File "src/app/client/audits/page.tsx" @'
"use client";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type Inspection = {
  id: string; created_at: string; reg: string | null;
  lat: number | null; lng: number | null; issues: string | null;
};

export default function AuditsPage() {
  const sb = getSupabaseClient();
  const [rows, setRows] = useState<Inspection[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("audit_inspections").select("*").order("created_at", { ascending: false }).limit(50);
      setRows((data || []) as Inspection[]);
    })();
  }, [sb]);

  return (
    <div className="card p-6">
      <h1 className="text-2xl font-bold mb-4">Audits</h1>
      <table className="w-full text-sm">
        <thead className="text-white/70"><tr>
          <th className="text-left p-2">Date</th>
          <th className="text-left p-2">Reg</th>
          <th className="text-left p-2">Location</th>
          <th className="text-right p-2">PDF</th>
        </tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.id} className="border-t border-white/10">
              <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
              <td className="p-2">{r.reg || "-"}</td>
              <td className="p-2">{(r.lat && r.lng) ? `${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}` : "-"}</td>
              <td className="p-2 text-right">
                <a className="navlink" href={`/api/audits/report/${r.id}?download=1`}>Download</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
'@

Write-File "src/app/api/audits/report/[id]/route.ts" @'
import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { buildAuditPdf } from "@/lib/pdf/auditTemplate";
import { BRAND } from "@/lib/pdf/brand";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const supabase = getServiceSupabase();

    const { data: audit, error } = await supabase
      .from("audit_inspections")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !audit) throw new Error("Audit not found");

    const { data: photosList } = await supabase
      .from("audit_photos")
      .select("path, filename")
      .eq("inspection_id", id);

    const photos: { filename: string; bytes: Uint8Array }[] = [];
    if (photosList?.length) {
      for (const p of photosList) {
        const { data: file } = await supabase.storage.from("audit-photos").download(p.path);
        if (file) {
          photos.push({
            filename: p.filename || p.path.split("/").pop() || "photo",
            bytes: new Uint8Array(await file.arrayBuffer()),
          });
        }
      }
    }

    const logoPath = path.join(process.cwd(), "public", BRAND.logoPath.replace(/^\//, ""));
    const logoBytes = await fs.readFile(logoPath).catch(() => new Uint8Array());

    const locStr =
      audit.lat != null && audit.lng != null
        ? `${audit.lat}, ${audit.lng}${audit.address ? " — " + audit.address : ""}`
        : (audit.address || "N/A");

    const findingsText = audit.issues ? String(audit.issues) : "No findings.";

    const pdfBytes = await buildAuditPdf(
      {
        id: audit.id,
        date: audit.created_at || new Date().toISOString(),
        inspector: audit.inspector || "N/A",
        vehicle: { reg: audit.reg || "", vin: audit.vin || "", make: audit.make || "", model: audit.model || "" },
        location: locStr,
        findings: findingsText,
        notes: audit.notes || "",
        photos,
      },
      logoBytes as Uint8Array
    );

    const filename = `audit-${id}.pdf`;
    const disp = req.nextUrl.searchParams.get("download") === "1"
      ? `attachment; filename="${filename}"`
      : `inline; filename="${filename}"`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disp,
        "Cache-Control": "private, max-age=0, must-revalidate"
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to render audit PDF" }, { status: 400 });
  }
}
'@

Write-File "src/app/client/wcp/page.tsx" @'
import PowerBIEmbed from "@/components/wcp/PowerBIEmbed";

export default function WcpHome() {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">Waste Compactor Assessments</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PowerBIEmbed reportId="fleet-health" embedUrl="" accessToken="" />
        <PowerBIEmbed reportId="recurring-faults" embedUrl="" accessToken="" />
      </div>
      <a className="btn" href="/client/wcp/new">New Assessment</a>
    </main>
  );
}
'@

Write-File "src/app/client/wcp/new/page.tsx" @'
"use client";
import Scanner from "@/components/wcp/Scanner";
import ChecklistForm from "@/components/wcp/ChecklistForm";
import SignaturePad from "@/components/wcp/SignaturePad";
import { useState } from "react";

export default function WcpNew() {
  const [vin, setVin] = useState<string>("");
  const [reg, setReg] = useState<string>("");

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">New Compactor Assessment</h1>
      <Scanner onFound={(d)=>{ setVin(d.vin||""); setReg(d.reg||""); }} />
      <ChecklistForm vin={vin} reg={reg} onSubmit={()=>alert("Submitted")} />
      <SignaturePad onDone={()=>alert("Signed")} />
    </main>
  );
}
'@

# --- Supabase SQL files ---
Write-File "supabase/schema_core.sql" @'
create table if not exists public.report_tiles (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  title text not null,
  value numeric not null default 0,
  unit text,
  delta numeric,
  spark numeric[] default '{}'
);

create table if not exists public.report_transactions (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  title text not null,
  ts timestamptz not null default now(),
  ref text,
  description text,
  amount numeric,
  entity text
);

create table if not exists public.audit_inspections (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  inspector text,
  reg text,
  vin text,
  make text,
  model text,
  lat double precision,
  lng double precision,
  address text,
  issues text,
  notes text
);

create table if not exists public.audit_photos (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references public.audit_inspections(id) on delete cascade,
  path text not null,
  filename text
);
'@

Write-File "supabase/rls_tighten.sql" @'
alter table public.report_tiles enable row level security;
alter table public.report_transactions enable row level security;
alter table public.audit_inspections enable row level security;
alter table public.audit_photos enable row level security;

drop policy if exists rt_select on public.report_tiles;
create policy rt_select on public.report_tiles for select using (auth.role() = 'authenticated');
drop policy if exists rt_write on public.report_tiles;
create policy rt_write on public.report_tiles for insert with check (auth.role() = 'authenticated');

drop policy if exists rtx_select on public.report_transactions;
create policy rtx_select on public.report_transactions for select using (auth.role() = 'authenticated');
drop policy if exists rtx_write on public.report_transactions;
create policy rtx_write on public.report_transactions for insert with check (auth.role() = 'authenticated');

drop policy if exists ai_select on public.audit_inspections;
create policy ai_select on public.audit_inspections for select using (auth.role() = 'authenticated');
drop policy if exists ai_write on public.audit_inspections;
create policy ai_write on public.audit_inspections for insert with check (auth.role() = 'authenticated');

drop policy if exists ap_select on public.audit_photos;
create policy ap_select on public.audit_photos for select using (auth.role() = 'authenticated');
drop policy if exists ap_write on public.audit_photos;
create policy ap_write on public.audit_photos for insert with check (auth.role() = 'authenticated');
'@

Write-Host "`nAll files written. Next steps:"
Write-Host "1) Copy .env.example to .env.local and fill your Supabase values."
Write-Host "2) In Supabase SQL editor, run supabase/schema_core.sql then supabase/rls_tighten.sql."
Write-Host "3) Create Storage bucket: audit-photos."
Write-Host "4) npm install"
Write-Host "5) npm run build"
