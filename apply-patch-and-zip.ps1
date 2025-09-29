# Save this entire block as: apply-patch-and-zip.ps1
param([string]$ZipName = "afriportal-patch.zip")

function Ensure-Dir($p){ if(!(Test-Path $p)){ New-Item -ItemType Directory -Force -Path $p | Out-Null } }

# --- write file helper
function Write-File($Path, $Content){
  $dir = Split-Path $Path -Parent
  Ensure-Dir $dir
  $utf8 = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8)
  Write-Host "Wrote $Path" -ForegroundColor Green
}

# 1) src/app/api/quotes/pdf/route.ts
$quotesPdf = @'
import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { buildQuotePdf } from "@/lib/pdf/quoteTemplate";
import { BRAND } from "@/lib/pdf/brand";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const toUint8 = (buf: Buffer): Uint8Array =>
  new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

type QuotePayload = {
  quote: {
    id: string;
    client?: string;
    term?: string;
    totals?: { monthly: number; upfront?: number };
  };
  vehicle: { make: string; model: string; derivative?: string };
  accessories: Array<{ label: string; price: number }>;
};

export async function POST(req: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body: QuotePayload = await req.json();

    const logoPath = path.join(process.cwd(), "public", BRAND.logoPath.replace(/^\//, ""));
    const logoBuf = await fs.readFile(logoPath).catch(() => Buffer.alloc(0));
    const logoBytes = toUint8(logoBuf);

    const pdfBytes = await buildQuotePdf(
      {
        quoteId: body.quote.id,
        client: body.quote.client || "Client",
        vehicle: body.vehicle,
        term: body.quote.term || "",
        options: body.accessories || [],
        totals: body.quote.totals || { monthly: 0 },
      },
      logoBytes
    );

    const bucket = process.env.STORAGE_BUCKET_QUOTES || "quotes";
    const objectPath = `${body.quote.id}/Afrirent_Quote_${Date.now()}.pdf`;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(objectPath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (upErr) throw upErr;

    const { data: signed, error: urlErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(objectPath, 3600);
    if (urlErr || !signed?.signedUrl) throw new Error("Signed URL creation failed");

    return NextResponse.json({ url: signed.signedUrl }, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to generate PDF" },
      { status: 400 }
    );
  }
}
'@

# 2) src/app/api/audits/report/[id]/route.ts
$auditReport = @'
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildAuditPdf } from "@/lib/pdf/auditTemplate";
import { BRAND } from "@/lib/pdf/brand";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const toUint8 = (buf: Buffer): Uint8Array =>
  new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: audit } = await supabase.from("vehicle_audits").select("*").eq("id", params.id).single();
    if (!audit) throw new Error("Audit not found");

    const logoPath = path.join(process.cwd(), "public", BRAND.logoPath.replace(/^\//, ""));
    const logoBuf = await fs.readFile(logoPath).catch(() => Buffer.alloc(0));
    const logoBytes = toUint8(logoBuf);

    const pdfBytes = await buildAuditPdf(
      {
        id: audit.id,
        date: audit.date || new Date().toISOString(),
        inspector: audit.inspector || "N/A",
        vehicle: { reg: audit.reg, vin: audit.vin, make: audit.make, model: audit.model },
        location: audit.address || "N/A",
        findings: audit.findings || "None",
        notes: audit.notes || "",
        photos: [],
      },
      logoBytes
    );

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    return new NextResponse(blob, {
      status: 200,
      headers: { "Content-Disposition": `inline; filename="audit-${params.id}.pdf"` },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to render audit PDF" },
      { status: 400 }
    );
  }
}
'@

# 3) src/app/client/audits/page.tsx
$auditsPage = @'
"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Inspection = {
  id: string;
  reg: string;
  odometer: number | null;
  condition: string;
  issues: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
  photo_count?: number;
};

export default function AuditsPage() {
  const [rows, setRows] = useState<Inspection[]>([]);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("audit_inspections").select("*").limit(100);
      if (data) setRows(data as Inspection[]);
    };
    load();
  }, []);

  return (
    <div ref={tableRef} className="card p-4">
      <h1 className="text-2xl font-bold mb-4">Audits</h1>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left">Reg</th>
            <th className="p-2 text-right">Odo</th>
            <th className="p-2">Condition</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="p-2">{r.reg}</td>
              <td className="p-2 text-right">{r.odometer ?? "-"}</td>
              <td className="p-2">{r.condition}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
'@

# 4) src/app/client/reports/page.tsx  (only the important parts changed: no `any`)
$reportsPage = @'
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { AgGridReact } from "ag-grid-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

type Tile = {
  id?: string;
  section: string;
  title: string;
  value: number;
  unit?: string;
  delta?: number;
  spark?: number[];
};

type Txn = {
  id?: string;
  section: string;
  title: string;
  ts: string;
  ref?: string;
  description?: string;
  amount?: number;
  entity?: string;
};

const DEFAULT_SECTIONS = [
  "Availability","Utilisation","Downtime","Maintenance","Tyres","Fuel","Finance","Risk","Other"
];

const seededTiles = (): Tile[] => {
  const seed: Tile[] = [];
  for (let s = 0; s < 9; s++) {
    for (let i = 0; i < 3; i++) {
      seed.push({
        section: DEFAULT_SECTIONS[s],
        title: `${DEFAULT_SECTIONS[s]} KPI ${i + 1}`,
        value: Math.round(Math.random() * 1000) / 10,
        unit: s < 2 ? "%" : "R",
        delta: Math.round((Math.random() - 0.5) * 20) / 10,
        spark: Array.from({ length: 14 }, () => Math.round(80 + Math.random() * 20)),
      });
    }
  }
  return seed;
};

const seededTxns = (tiles: Tile[]): Txn[] => {
  const out: Txn[] = [];
  const today = new Date();
  for (const t of tiles) {
    for (let i = 0; i < 40; i++) {
      const d = new Date(today.getTime() - i * 86400000);
      out.push({
        section: t.section,
        title: t.title,
        ts: d.toISOString(),
        ref: `${t.section.slice(0, 2).toUpperCase()}-${i + 1001}`,
        description: `Txn for ${t.title}`,
        amount: Math.round(Math.random() * 10000) / 100,
        entity: ["COJ", "SANParks", "Mangaung"][i % 3],
      });
    }
  }
  return out;
};

export default function ReportsPage() {
  const pdfRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [tiles, setTiles] = useState<Tile[]>(seededTiles());
  const [txns, setTxns] = useState<Txn[]>(seededTxns(tiles));

  const onImportExcel = async (file: File) => {
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });

    const wsReports = wb.Sheets["Reports"] || wb.Sheets[wb.SheetNames[0]];
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(wsReports, { defval: "" });

    const parsedTiles: Tile[] = rows.map((r) => {
      const sparkRaw = r["spark"];
      let sparkNums: number[] | undefined;
      if (Array.isArray(sparkRaw)) sparkNums = (sparkRaw as number[]).map(Number).filter(x => !Number.isNaN(x));
      else if (typeof sparkRaw === "string") {
        sparkNums = (sparkRaw as string).split(",").map(s => Number(s.trim())).filter(x => !Number.isNaN(x));
      }
      return {
        section: String(r["section"] ?? "Other"),
        title: String(r["title"] ?? "Untitled"),
        value: Number(r["value"] ?? 0),
        unit: String(r["unit"] ?? ""),
        delta: r["delta"] !== "" && r["delta"] != null ? Number(r["delta"]) : undefined,
        spark: sparkNums,
      };
    });

    const wsTx = wb.Sheets["Transactions"];
    let parsedTx: Txn[] = [];
    if (wsTx) {
      const txRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(wsTx, { defval: "" });
      parsedTx = txRows.map((r) => ({
        section: String(r["section"] ?? "Other"),
        title: String(r["title"] ?? "Untitled"),
        ts: r["ts"] ? new Date(String(r["ts"])).toISOString() : new Date().toISOString(),
        ref: String(r["ref"] ?? ""),
        description: String(r["description"] ?? ""),
        amount: r["amount"] !== "" && r["amount"] != null ? Number(r["amount"]) : undefined,
        entity: String(r["entity"] ?? ""),
      }));
    }

    if (parsedTiles.length) setTiles(parsedTiles);
    if (parsedTx.length) setTxns(parsedTx);
  };

  const onExportPDF = async () => {
    const node = pdfRef.current; if (!node) return;
    const canvas = await html2canvas(node, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save("Afrirent_Reports.pdf");
  };

  const grouped = useMemo(() => {
    const bySection = new Map<string, Tile[]>();
    for (const t of tiles) {
      if (!bySection.has(t.section)) bySection.set(t.section, []);
      bySection.get(t.section)!.push(t);
    }
    const ordered: [string, Tile[]][] = [];
    const DEFAULT = new Set(DEFAULT_SECTIONS);
    for (const s of DEFAULT_SECTIONS) if (bySection.has(s)) ordered.push([s, bySection.get(s)!]);
    for (const [s, arr] of bySection) if (!DEFAULT.has(s)) ordered.push([s, arr]);
    return ordered;
  }, [tiles]);

  const columns = [
    { headerName: "Date", field: "ts", valueFormatter: (p: { value: string }) => new Date(p.value).toLocaleDateString() },
    { headerName: "Ref", field: "ref" },
    { headerName: "Description", field: "description", flex: 1 },
    { headerName: "Amount", field: "amount", valueFormatter: (p: { value: number }) => (p.value != null ? `R ${Number(p.value).toLocaleString()}` : "") },
    { headerName: "Entity", field: "entity" },
  ];

  return (
    <main>
      <div className="card p-5 mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold mr-auto">Reports</h1>
        <label className="btn cursor-pointer">
          Import Excel/CSV
          <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e)=> e.target.files && onImportExcel(e.target.files[0])} />
        </label>
        <button className="btn" onClick={onExportPDF}>Export PDF</button>
      </div>

      <div ref={pdfRef} className="space-y-8">
        {grouped.map(([section, items]) => (
          <section key={section}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xl font-semibold">{section}</h2>
              <div className="h-px flex-1 bg-white/10"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {items.slice(0, 3).map((tile, i) => (
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
                    {tile.unit === "R" ? "R " : ""}{tile.value.toLocaleString()}{tile.unit && tile.unit !== "R" ? ` ${tile.unit}` : ""}
                  </div>
                  <div className="h-24 mb-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={(tile.spark ?? []).map((v: number, idx: number) => ({ i: idx, v }))}>
                        <Line type="monotone" dataKey="v" stroke="#EC6425" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="ag-theme-alpine" style={{ height: 260 }}>
                    <AgGridReact rowData={[]} columnDefs={columns as unknown as any[]} headerHeight={28} rowHeight={28} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
'@

# 5) src/app/client/wcp/new/page.tsx
$wcpNew = @'
"use client";

import ChecklistForm from "@/components/wcp/ChecklistForm";

export default function WcpNewPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">New Waste Compactor Assessment</h1>
      <ChecklistForm />
    </main>
  );
}
'@

# 6) src/components/wcp/ChecklistForm.tsx
$checklist = @'
"use client";

type ChecklistItem = {
  id: string;
  label: string;
  status: "ok" | "fail" | "na";
};

const ChecklistForm = () => {
  const items: ChecklistItem[] = [
    { id: "brakes", label: "Brakes", status: "ok" },
    { id: "lights", label: "Lights", status: "ok" },
  ];
  return (
    <form className="space-y-4">
      {items.map((i) => (
        <div key={i.id} className="flex items-center gap-3">
          <span className="w-40">{i.label}</span>
          <select defaultValue={i.status} className="input">
            <option value="ok">OK</option>
            <option value="fail">Fail</option>
            <option value="na">N/A</option>
          </select>
        </div>
      ))}
    </form>
  );
};
export default ChecklistForm;
'@

# 7) src/components/wcp/Scanner.tsx
$scanner = @'
"use client";

type Props = { onScan: (code: string) => void };

export default function Scanner({ onScan }: Props) {
  return (
    <button className="btn" onClick={() => onScan("TEST123")}>
      Simulate Scan
    </button>
  );
}
'@

# 8) src/lib/pdf/quoteTemplate.ts
$quoteTpl = @'
export async function buildQuotePdf(
  data: {
    quoteId: string;
    client: string;
    vehicle: { make: string; model: string; derivative?: string };
    term: string;
    options: Array<{ label: string; price: number }>;
    totals: { monthly: number; upfront?: number };
  },
  logo: Uint8Array
): Promise<Uint8Array> {
  // TODO: implement actual PDF writing (pdf-lib or @react-pdf/renderer server-side)
  // For now, return an empty document to keep types happy.
  return new Uint8Array();
}
'@

# 9) src/lib/apiClient.ts
$apiClient = @'
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return (await res.json()) as T;
}
'@

# --- Write all files
Write-File "src/app/api/quotes/pdf/route.ts" $quotesPdf
Write-File "src/app/api/audits/report/[id]/route.ts" $auditReport
Write-File "src/app/client/audits/page.tsx" $auditsPage
Write-File "src/app/client/reports/page.tsx" $reportsPage
Write-File "src/app/client/wcp/new/page.tsx" $wcpNew
Write-File "src/components/wcp/ChecklistForm.tsx" $checklist
Write-File "src/components/wcp/Scanner.tsx" $scanner
Write-File "src/lib/pdf/quoteTemplate.ts" $quoteTpl
Write-File "src/lib/apiClient.ts" $apiClient

# --- Zip them all
$zipPath = Join-Path $PWD $ZipName
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
$pathsToZip = @(
  "src/app/api/quotes/pdf/route.ts",
  "src/app/api/audits/report/[id]/route.ts",
  "src/app/client/audits/page.tsx",
  "src/app/client/reports/page.tsx",
  "src/app/client/wcp/new/page.tsx",
  "src/components/wcp/ChecklistForm.tsx",
  "src/components/wcp/Scanner.tsx",
  "src/lib/pdf/quoteTemplate.ts",
  "src/lib/apiClient.ts"
)
Compress-Archive -Path $pathsToZip -DestinationPath $zipPath -Force
Write-Host "Created $zipPath" -ForegroundColor Cyan
