"use client";

type Props = {
  title: string;
  urlEnvVar?: string; // optional name of env var (e.g. NEXT_PUBLIC_POWERBI_URL)
  fallbackNote?: string;
};

export default function PowerBIEmbed({ title, urlEnvVar, fallbackNote }: Props) {
  const url = urlEnvVar ? (process.env[urlEnvVar] as string | undefined) : undefined;
  const finalUrl = url || process.env.NEXT_PUBLIC_POWERBI_URL || "";

  if (!finalUrl) {
    return (
      <div className="card p-6 watermark">
        <div className="text-white/70 text-sm mb-2">{title}</div>
        <div className="h-[360px] grid place-items-center text-center">
          <div>
            <div className="text-lg font-semibold mb-1">Analytics Not Configured</div>
            <div className="text-white/50 text-sm">
              Provide <code className="px-1 py-0.5 bg-white/10 rounded">NEXT_PUBLIC_POWERBI_URL</code> to embed your Power BI report.
              <br />{fallbackNote || "Using placeholder until configured."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 overflow-hidden">
      <div className="text-white/70 text-sm mb-2">{title}</div>
      <iframe
        title={title}
        src={finalUrl}
        className="w-full h-[480px] rounded-lg border border-white/10"
        frameBorder={0}
        allowFullScreen
      />
    </div>
  );
}
