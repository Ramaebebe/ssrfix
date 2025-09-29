export default function Sparkline({ points }: { points: number[] }) {
  if (!points.length) return null;
  const w = 300, h = 60;
  const max = Math.max(...points), min = Math.min(...points);
  const norm = (v: number) => max === min ? h / 2 : h - ((v - min) / (max - min)) * h;
  const step = w / (points.length - 1 || 1);
  const d = points.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${norm(v)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
