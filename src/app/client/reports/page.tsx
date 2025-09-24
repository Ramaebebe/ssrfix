"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { AgGridReact } from "ag-grid-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getSupabaseClient } from "@/lib/supabaseClient";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

type Tile = { id?: string; section: string; title: string; value: number; unit?: string; delta?: number; spark?: number[]; };
type Txn  = { id?: string; section: string; title: string; ts: string; ref?: string; description?: string; amount?: number; entity?: string; };

const DEFAULT_SECTIONS = ["Availability","Utilisation","Downtime","Maintenance","Tyres","Fuel","Finance","Risk","Other"];

const seededTiles = (): Tile[] => {
  const seed: Tile[] = [];
  for (let s = 0; s < 9; s++) for (let i = 0; i < 3; i++) {
    seed.push({
      section: DEFAULT_SECTIONS[s],
      title: `${DEFAULT_SECTIONS[s]} KPI ${i + 1}`,
      value: Math.round(Math.random() * 1000) / 10,
      unit: s < 2 ? "%" : "R",
      delta: Math.round((Math.random() - 0.5) * 20) / 10,
      spark: Array.from({ length: 14 }, () => Math.round(80 + Math.random() * 20)),
    });
  }
  return seed;
};
const seededTxns = (tiles: Tile[]): Txn[] => {
  const out: Txn[] = []; const today = new Date();
  for (const t of tiles) for (let i = 0; i < 40; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    out.push({ section: t.section, title: t.title, ts: d.toISOString(), ref: `${t.section.slice(0,2).toUpperCase()}-${i+1001}`, description: `Txn for ${t.title}`, amount: Math.round(Math.random()*10000)/100, entity: ["COJ","SANParks","Mangaung"][i%3] });
  }
  return out;
};

export default function ReportsPage() {
  const sb = getSupabaseClient();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [tiles, setTiles] = useState<Tile[]>(seededTiles());
  const [txns, setTxns] = useState<Txn[]>(seededTxns(tiles));

  const loadFromSupabase = async () => {
    if (!sb) return;
    setLoading(true);
    try {
      const { data: t } = await sb.from("report_tiles").select("*");
      if (t?.length) {
        setTiles(t.map((r: any) => ({
          section: r.section, title: r.title, value: Number(r.value ?? 0),
          unit: r.unit ?? undefined, delta: r.delta != null ? Number(r.delta) : undefined,
          spark: Array.isArray(r.spark) ? r.spark : (typeof r.spark === "string" ? r.spark.split(",").map((n:string)=>Number(n.trim())) : []),
        })));
      }
      const { data: d } = await sb.from("report_transactions").select("*").order("ts",{ascending:false}).limit(2000);
      if (d?.length) {
        setTxns(d.map((r:any)=>({ section:r.section, title:r.title, ts:r.ts, ref:r.ref??undefined, description:r.description??undefined, amount:r.amount!=null?Number(r.amount):undefined, entity:r.entity??undefined })));
      }
    } finally { setLoading(false); }
  };
  useEffect(()=>{ loadFromSupabase(); }, []);

  const onImportExcel = async (file: File) => {
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });

    const wsReports = wb.Sheets["Reports"] || wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(wsReports, { defval: "" });
    const parsedTiles: Tile[] = rows.map((r)=>({
      section: String(r.section||r.Section||"Other"),
      title:   String(r.title||r.Title||"Untitled"),
      value:   Number(r.value||r.Value||0),
      unit:    String(r.unit||r.Unit||""),
      delta:   r.delta!=="" ? Number(r.delta) : undefined,
      spark: typeof r.spark === "string"
        ? r.spark
            .split(",")
            .map((n: string) => Number(n.trim()))
            .filter((x: number) => !Number.isNaN(x))
        : undefined,
    }));

    const wsTx = wb.Sheets["Transactions"];
    let parsedTx: Txn[] = [];
    if (wsTx) {
      const txRows: any[] = XLSX.utils.sheet_to_json(wsTx, { defval: "" });
      parsedTx = txRows.map((r)=>({
        section: String(r.section||r.Section||"Other"),
        title:   String(r.title||r.Title||"Untitled"),
        ts:      r.ts ? new Date(r.ts).toISOString() : new Date().toISOString(),
        ref:     String(r.ref||r.Ref||""),
        description: String(r.description||r.Description||""),
        amount:  r.amount!=="" ? Number(r.amount) : undefined,
        entity:  String(r.entity||r.Entity||""),
      }));
    }

    if (sb) {
      try {
        if (parsedTiles.length) await sb.from("report_tiles").upsert(parsedTiles.map(t=>({ ...t, spark: t.spark ?? [] })));
        if (parsedTx.length)    await sb.from("report_transactions").upsert(parsedTx);
      } catch (e) { console.warn("Supabase upsert error:", e); }
    }

    if (parsedTiles.length) setTiles(parsedTiles);
    if (parsedTx.length)    setTxns(parsedTx);
  };

  const onExportExcel = async () => {
    const XLSX = await import("xlsx");
    const reports = tiles.map(t=>({ section:t.section, title:t.title, value:t.value, unit:t.unit??"", delta:t.delta??"", spark:(t.spark??[]).join(",") }));
    const tx      = txns.map (r=>({ section:r.section, title:r.title, ts:r.ts, ref:r.ref??"", description:r.description??"", amount:r.amount??"", entity:r.entity??"" }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reports), "Reports");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tx), "Transactions");
    XLSX.writeFile(wb, "Afrirent_Reports.xlsx");
  };

  const onExportPDF = async () => {
    const node = pdfRef.current; if (!node) return;
    const canvas = await html2canvas(node, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
    const w = pdf.internal.pageSize.getWidth(), h = pdf.internal.pageSize.getHeight();
    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save("Afrirent_Reports.pdf");
  };

  const grouped = useMemo(()=>{
    const by = new Map<string, Tile[]>(); tiles.forEach(t=>{ if(!by.has(t.section)) by.set(t.section, []); by.get(t.section)!.push(t); });
    const out: [string, Tile[]][] = []; const DEF = new Set(DEFAULT_SECTIONS);
    DEFAULT_SECTIONS.forEach(s=>{ if(by.has(s)) out.push([s, by.get(s)!]); });
    for (const [s, arr] of by) if (!DEF.has(s)) out.push([s,arr]);
    return out;
  }, [tiles]);

  const txByKey = useMemo(()=>{
    const m = new Map<string, Txn[]>();
    txns.forEach(r=>{ const k = `${r.section}|||${r.title}`; if(!m.has(k)) m.set(k, []); m.get(k)!.push(r); });
    for (const [k, arr] of m) arr.sort((a,b)=> (a.ts>b.ts ? -1 : 1));
    return m;
  }, [txns]);

  const columns = [
    { headerName: "Date", field: "ts", valueFormatter: (p:any)=> new Date(p.value).toLocaleDateString() },
    { headerName: "Ref", field: "ref" },
    { headerName: "Description", field: "description", flex: 1 },
    { headerName: "Amount", field: "amount", valueFormatter: (p:any)=> (p.value!=null ? `R ${Number(p.value).toLocaleString()}` : "") },
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
        <button className="btn" onClick={onExportExcel}>Export Excel</button>
        <button className="btn" onClick={onExportPDF}>Export PDF</button>
        <button className="navlink" onClick={loadFromSupabase} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
      </div>

      <div ref={pdfRef} className="space-y-8">
        {grouped.map(([section, items])=>(
          <section key={section}>
            <div className="flex items-center gap-3 mb-3">
              <img src="/brand/report_icon.png" className="h-6 opacity-80" alt="" />
              <h2 className="text-xl font-semibold">{section}</h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {items.slice(0,3).map((tile,i)=>{
                const key = `${tile.section}|||${tile.title}`;
                const rows = (txByKey.get(key) ?? []).slice(0,20);
                return (
                  <div key={i} className="card p-5 watermark">
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="text-sm text-white/70">{tile.title}</div>
                      {tile.delta!==undefined && <div className={tile.delta>=0 ? "text-green-400 text-xs" : "text-red-400 text-xs"}>{tile.delta>=0?"+":""}{tile.delta}</div>}
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      {tile.unit==="R" ? "R " : ""}{tile.value.toLocaleString()}{tile.unit && tile.unit!=="R" ? ` ${tile.unit}` : ""}
                    </div>
                    <div className="h-24 mb-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={(tile.spark ?? []).map((v,idx)=>({i:idx,v}))}>
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
