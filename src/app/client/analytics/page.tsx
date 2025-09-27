import EmbedFrame from "@/components/analytics/EmbedFrame";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  // Replace these with Metabase/Superset/Redash/Looker Studio share links
  const METABASE_DASHBOARD_URL = process.env.NEXT_PUBLIC_MB_FLEET_URL || "https://your-metabase.example/public/dashboard/...";
  const SUPerset_URL = process.env.NEXT_PUBLIC_SUPERSET_URL || "https://your-superset.example/superset/explore/?r=...";
  const LOOKER_STUDIO_URL = process.env.NEXT_PUBLIC_LOOKER_URL || "https://lookerstudio.google.com/reporting/...";
  const REDASH_URL = process.env.NEXT_PUBLIC_REDASH_URL || "https://redash.example/public/dashboards/123-abc";

  return (
    <main className="container-tight py-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <EmbedFrame title="Fleet Health (Metabase)" src={METABASE_DASHBOARD_URL} height={560} />
      <EmbedFrame title="Recurring Faults (Superset)" src={SUPerset_URL} height={560} />
      <EmbedFrame title="KPI Overview (Looker Studio)" src={LOOKER_STUDIO_URL} height={560} />
      <EmbedFrame title="Ops Snapshot (Redash)" src={REDASH_URL} height={560} />
    </main>
  );
}
