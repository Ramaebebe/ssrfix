"use client";
import React from "react";

/**
 * Generic analytics embed via <iframe>.
 * Use with Metabase/Superset/Redash/Looker Studio share links.
 */
export default function EmbedFrame({
  title,
  src,
  height = 560
}: { title: string; src: string; height?: number }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-2 border-b border-white/10 text-white/80 text-sm">{title}</div>
      <iframe
        src={src}
        style={{ width: "100%", height }}
        allow="fullscreen"
        loading="lazy"
        className="bg-white"
      />
    </div>
  );
}
