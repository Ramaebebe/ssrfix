"use client";
export const dynamic = 'force-dynamic';
import dynamic from "next/dynamic";
const KpiCard = dynamic(() => import("@/components/KpiCard"), { ssr: false });
const AvailabilityChart = dynamic(() => import("@/components/charts/AvailabilityChart"), { ssr: false });
const DowntimeByCategory = dynamic(() => import("@/components/charts/DowntimeByCategory"), { ssr: false });
const DataTable = dynamic(() => import("@/components/DataTable"), { ssr: false });
export default function DashboardPage() {
  const kpis = [
    { label: "Fleet Availability", value: "94.2%", sub: "Target ≥ 95%" },
    { label: "Utilisation (km/veh/mo)", value: "1,284", sub: "Last 30 days" },
    { label: "Downtime (hrs)", value: "312", sub: "Month to date" },
    { label: "Rebills Outstanding", value: "R 428,000", sub: "Awaiting client" }
  ];
  const rows = [
    { reg:"FZC504L", entity:"COJ", status:"In Service", avail: "88.0%", downtime:"44h", util:"1,122" },
    { reg:"JDK901GP", entity:"SANParks", status:"Workshop", avail: "72.5%", downtime:"128h", util:"698" },
    { reg:"HLR222EC", entity:"Mangaung", status:"In Service", avail:"97.3%", downtime:"11h", util:"1,876" }
  ];
  return (
    <main className="container-tight">
      <div className="grid md:grid-cols-4 gap-4">{kpis.map((k,i)=>(<KpiCard key={i} label={k.label} value={k.value} sub={k.sub} />))}</div>
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div className="card p-4"><h3 className="font-semibold mb-2">Availability (30 days)</h3><AvailabilityChart /></div>
        <div className="card p-4"><h3 className="font-semibold mb-2">Downtime by Category</h3><DowntimeByCategory /></div>
      </div>
      <div className="card p-4 mt-4"><h3 className="font-semibold mb-2">Fleet Snapshot</h3><DataTable rows={rows} /></div>
    </main>
  );
}
