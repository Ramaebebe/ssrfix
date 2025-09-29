"use client";
import EmbedFrame from "@/components/analytics/EmbedFrame";
export default function PowerBIEmbed({ title, embedUrl }:{title:string; embedUrl:string}){
  return <EmbedFrame title={title} src={embedUrl} />;
}
const url1 = process.env.NEXT_PUBLIC_ANALYTICS_URL || process.env.NEXT_PUBLIC_POWERBI_URL || "";
