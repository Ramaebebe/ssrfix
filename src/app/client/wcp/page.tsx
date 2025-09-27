"use client";
import PowerBIEmbed from "@/components/wcp/PowerBIEmbed";

export default function WCPDashboard() {
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Waste Compactor Assessments</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PowerBIEmbed reportId="fleet-health" />
        <PowerBIEmbed reportId="recurring-faults" />
      </div>
    </main>
  );
}
