"use client";

import React from "react";

/**
 * Lightweight analytics embed that works with:
 * - Power BI Publish-to-web / Report Server / Any BI tool that exposes an embeddable URL
 * - Metabase public dashboards
 * - Superset public dashboards
 * - Looker Studio share links
 *
 * If no embedUrl is provided, we show a friendly placeholder explaining how to configure it.
 */
type Props = {
  title: string;
  embedUrl?: string;   // e.g. NEXT_PUBLIC_ANALYTICS_URL
  height?: number;     // optional override
};

export default function PowerBIEmbed({ title, embedUrl, height = 420 }: Props) {
  const hasUrl = typeof embedUrl === "string" && embedUrl.trim().length > 0;

  if (!hasUrl) {
    return (
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/70">
            Not configured
          </span>
        </div>
        <p className="text-sm text-white/70 mb-2">
          No analytics URL configured. Provide a public/embed URL via{" "}
          <code className="text-white/90">NEXT_PUBLIC_ANALYTICS_URL</code> (and
         /or <code className="text-white/90">NEXT_PUBLIC_ANALYTICS_URL_2</code>) in{" "}
          <code className="text-white/90">.env.local</code>.
        </p>
        <ul className="list-disc list-inside text-sm text-white/60 space-y-1">
          <li>Power BI: “Publish to web” or embed URL (if your tenant permits).</li>
          <li>Metabase: public dashboard link.</li>
          <li>Superset: public/exposed dashboard URL.</li>
          <li>Looker Studio: shareable embed link.</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <a
          href={embedUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs navlink"
          title="Open in new tab"
        >
          Open
        </a>
      </div>

      {/* Simple responsive iframe container */}
      <div className="w-full" style={{ height }}>
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allow="fullscreen; clipboard-read; clipboard-write"
          className="w-full h-full rounded-xl border border-white/10"
        />
      </div>
    </div>
  );
}
