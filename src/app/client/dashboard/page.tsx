"use client";
export const dynamic = "force-dynamic";

import NextDynamic from "next/dynamic";

// keep these if the files exist
const KpiCard = NextDynamic(() => import("@/components/KpiCard"), { ssr: false });
const AvailabilityChart = NextDynamic(() => import("@/components/charts/AvailabilityChart"), { ssr: false });
const DowntimeByCategory = NextDynamic(() => import("@/components/charts/DowntimeByCategory"), { ssr: false });

/**
 * Inline DataTable to avoid missing '@/components/DataTable'.
 * If you later add a reusable component, you can swap this back to a dynamic import.
 */
type Row = {
  reg: string;
  entity: string;
  status: string;
  avail: string;
  downtime: string;
  util: string;
};

function InlineDataTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-white/70 border-b border-white/10">
          <tr>
            <th className="text-left p-2">Reg</th>
            <th className="text-left p-2">Entity</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Availability</th>
            <th className="text-left p-2">Downtime</th>
            <th className="text-left p-2">Utilisation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.reg} className="border-b border-white/5">
              <td className="p-2">{r.reg}</td>
              <td className="p-2">{r.entity}</td>
              <td className="p-2">{r.status}</td>
              <td className="p-2">{r.avail}</td>
              <td className="p-2">{r.downtime}</td>
              <td className="p-2">{r.util}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardPage() {
  const kpis = [
    { label: "Fleet Availability", value: "94.2%", sub: "Target ≥ 95%" },
    { label: "Utilisation (km/veh/mo)", value: "1,284", sub: "Last 30 days" },
    { label: "Downtime (hrs)", value: "312", sub: "Month to date" },
    { label: "Rebills Outstanding", value: "R 428,000", sub: "Awaiting client" }
  ];

  const rows: Row[] = [
    { reg: "FZC504L", entity: "COJ",       status: "In Service", avail: "88.0%", downtime: "44h",  util: "1,122" },
    { reg: "JDK901GP", entity: "SANParks",  status: "Workshop",   avail: "72.5%", downtime: "128h", util: "698" },
    { reg: "HLR222EC", entity: "Mangaung",  status: "In Service", avail: "97.3%", downtime: "11h",  util: "1,876" }
  ];

  return (
    <main>
      <div className="grid md:grid-cols-4 gap-5">
        {kpis.map((k, i) => (
          <KpiCard key={i} label={k.label} value={k.value} sub={k.sub} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div className="card p-6 watermark">
          <h3 className="section-title">Availability (30 days)</h3>
          <AvailabilityChart />
        </div>
        <div className="card p-6 watermark">
          <h3 className="section-title">Downtime by Category</h3>
          <DowntimeByCategory />
        </div>
      </div>

      <div className="card p-6 mt-6 watermark">
        <h3 className="section-title">Fleet Snapshot</h3>
        <InlineDataTable rows={rows} />
      </div>
    </main>
  );
}
