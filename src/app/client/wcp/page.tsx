"use client";

import PowerBIEmbed from "@/components/wcp/PowerBIEmbed";

export default function WcpLanding() {
  // Because this is a client component, NEXT_PUBLIC_* vars are available here.
  const url1 = process.env.NEXT_PUBLIC_ANALYTICS_URL || "";
  const url2 = process.env.NEXT_PUBLIC_ANALYTICS_URL_2 || "";

  return (
    <main className="container-tight py-6 space-y-6">
      <h1 className="text-2xl font-bold">Waste Compactor Assessments</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PowerBIEmbed title="Fleet Health" embedUrl={url1} />
        <PowerBIEmbed title="Recurring Faults" embedUrl={url2} />
      </div>
    </main>
  );
}
