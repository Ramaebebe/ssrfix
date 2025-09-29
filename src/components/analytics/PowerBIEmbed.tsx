"use client";

import React from "react";

type Props = {
  title: string;
  /** Full Power BI embed URL (reportEmbed) */
  embedUrl: string;
  /** Optional: height in pixels (defaults to 680) */
  height?: number;
};

export default function PowerBIEmbed({ title, embedUrl, height = 680 }: Props) {
  if (!embedUrl) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-white/70">No embed URL configured.</p>
      </div>
    );
  }

  // Minimal hardening: only allow app.powerbi.com URLs
  const url = new URL(embedUrl);
  if (url.hostname !== "app.powerbi.com") {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-red-400">Invalid host for embed: {url.hostname}</p>
      </div>
    );
  }

  return (
    <div className="card p-4 watermark">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <a
          href={embedUrl}
          target="_blank"
          rel="noreferrer"
          className="navlink"
          aria-label="Open in Power BI"
        >
          Open in Power BI
        </a>
      </div>
      <iframe
        title={title}
        src={embedUrl}
        allowFullScreen
        // @ts-expect-error next/iframe typing is strict in some versions
        frameBorder="0"
        className="w-full rounded-xl"
        style={{ height }}
      />
    </div>
  );
}
