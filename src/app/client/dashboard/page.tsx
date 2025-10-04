"use client";
export const dynamic = "force-dynamic";

import KpiCard from "@/components/KpiCard";
import AvailabilityChart from "@/components/charts/AvailabilityChart";
import DowntimeByCategory from "@/components/charts/DowntimeByCategory";

export default function DashboardPage() {
  const kpis = [
    { label: "Fleet Availability", value: "94.2%", sub: "Target ≥ 95%" },
    { label: "Utilisation (km/veh/mo)", value: "1,284", sub: "Last 30 days" },
    { label: "Downtime (hrs)", value: "312", sub: "Month to date" },
    { label: "Rebills Outstanding", value: "R 428,000", sub: "Awaiting client" },
  ];

  const rows = [
    { reg:"FZC504L", entity:"COJ", status:"In Service", avail:"88.0%", downtime:"44h", util:"1,122" },
    { reg:"JDK901GP", entity:"SANParks", status:"Workshop",  avail:"72.5%", downtime:"128h", util:"698" },
    { reg:"HLR222EC", entity:"Mangaung", status:"In Service", avail:"97.3%", downtime:"11h", util:"1,876" },
  ];

  return (
    <main className="container-tight py-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid md:grid-cols-4 gap-5">
        {kpis.map((k, i) => (
          <KpiCard key={i} label={k.label} value={k.value} sub={k.sub} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white/70">
              <tr>
                <th className="text-left p-2">Reg</th>
                <th className="text-left p-2">Entity</th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2">Availability</th>
                <th className="text-right p-2">Downtime</th>
                <th className="text-right p-2">Utilisation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-white/10">
                  <td className="p-2">{r.reg}</td>
                  <td className="p-2">{r.entity}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2 text-right">{r.avail}</td>
                  <td className="p-2 text-right">{r.downtime}</td>
                  <td className="p-2 text-right">{r.util}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
