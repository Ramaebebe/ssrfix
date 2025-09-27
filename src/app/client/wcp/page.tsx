"use client";

/**
 * Remove the missing '@/components/wcp/PowerBIEmbed' import
 * and inline a simple iframe card that works with any embeddable URL
 * (Looker Studio, Metabase, Grafana, etc.).
 */
function IframeCard({ title, url }: { title: string; url: string }) {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <img src="/brand/report_icon.png" className="h-6 opacity-80" alt="" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {url ? (
        <iframe
          src={url}
          className="w-full h-[420px] rounded-xl"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="text-sm text-white/60">
          No analytics URL configured. Set <code className="mx-1">NEXT_PUBLIC_ANALYTICS_URL</code> and{" "}
          <code className="mx-1">NEXT_PUBLIC_ANALYTICS_URL_2</code> in your environment.
        </div>
      )}
    </div>
  );
}

export default function WcpLanding() {
  // Client component → NEXT_PUBLIC_* is available
  const url1 = process.env.NEXT_PUBLIC_ANALYTICS_URL || "";
  const url2 = process.env.NEXT_PUBLIC_ANALYTICS_URL_2 || "";

  return (
    <main className="container-tight py-6 space-y-6">
      <h1 className="text-2xl font-bold">Waste Compactor Assessments</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <IframeCard title="Fleet Health" url={url1} />
        <IframeCard title="Recurring Faults" url={url2} />
      </div>
    </main>
  );
}
