export default function KpiCard({
  label, value, sub,
}: { label: string; value: string | number; sub?: string; }) {
  return (
    <div className="card p-4">
      <div className="text-sm text-white/70">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-white/50 mt-1">{sub}</div>}
    </div>
  );
}
