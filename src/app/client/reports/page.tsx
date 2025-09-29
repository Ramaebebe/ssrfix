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