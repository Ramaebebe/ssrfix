// src/app/client/dashboard/page.tsx
"use client";

import KpiCard from "@/components/KpiCard";
import Sparkline from "@/components/Sparkline";
import DataTable from "@/components/DataTable";

type SnapshotRow = {
  id: string;
  reg: string;
  entity: string;
  status: string;
  availability: string;
  downtimeHrs: number;
  utilisationKm: number;
};

export default function DashboardPage() {
  const kpis = [
    { label: "Fleet Availability", value: "94.2%", sub: "Target ≥ 95%" },
    { label: "Utilisation (km/veh/mo)", value: "1,284", sub: "Last 30 days" },
    { label: "Downtime (hrs)", value: "312", sub: "Month to date" },
    { label: "Rebills Outstanding", value: "R 428,000", sub: "Awaiting client" },
  ];

  const spark = [81, 83, 80, 84, 85, 86, 82, 88, 90, 91, 93, 92, 94, 95];

  const rows: SnapshotRow[] = [
    { id: "1", reg: "FZC504L", entity: "COJ", status: "In Service", availability: "88.0%", downtimeHrs: 44, utilisationKm: 1122 },
    { id: "2", reg: "JDK901GP", entity: "SANParks", status: "Workshop", availability: "72.5%", downtimeHrs: 128, utilisationKm: 698 },
    { id: "3", reg: "HLR222EC", entity: "Mangaung", status: "In Service", availability: "97.3%", downtimeHrs: 11, utilisationKm: 1876 },
  ];

  return (
    <main className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} sub={k.sub} />
        ))}
      </div>

      <div className="card p-6">
        <h3 className="section-title">Availability (sparkline)</h3>
        <Sparkline points={spark} />
      </div>

      <div className="card p-6">
        <h3 className="section-title">Fleet Snapshot</h3>
        <DataTable<SnapshotRow>
          rows={rows}
          columns={[
            { key: "reg", header: "Reg" },
            { key: "entity", header: "Entity" },
            { key: "status", header: "Status" },
            { key: "availability", header: "Availability", align: "right" },
            { key: "downtimeHrs", header: "Downtime (h)", align: "right" },
            { key: "utilisationKm", header: "Util (km)", align: "right" },
          ]}
        />
      </div>
    </main>
  );
}
