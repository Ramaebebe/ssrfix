"use client";

import PowerBIEmbed from "@/components/analytics/PowerBIEmbed";

const DEFAULT_EMBED =
  "https://app.powerbi.com/reportEmbed?reportId=f092e1d3-270e-44a0-824e-94ca12b6cda7&autoAuth=true&ctid=0dcb462f-fcc7-4852-b16c-ef3a8568763e&actionBarEnabled=true";

export default function PowerBIPage() {
  const url1 = process.env.NEXT_PUBLIC_POWERBI_URL ?? DEFAULT_EMBED;
  // You can add a second report if you like
  const url2 = process.env.NEXT_PUBLIC_POWERBI_URL_2 ?? "";

  return (
    <main className="container-tight py-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="grid grid-cols-1 gap-6">
        <PowerBIEmbed title="2025 Dashboard" embedUrl={url1} height={720} />
        {url2 && <PowerBIEmbed title="Recurring Faults" embedUrl={url2} height={720} />}
      </div>
    </main>
  );
}
