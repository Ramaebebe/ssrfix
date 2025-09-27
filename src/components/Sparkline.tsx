"use client";
import { LineChart, Line, ResponsiveContainer } from "recharts";

export default function Sparkline({ series }: { series: number[] }) {
  const data = series.map((v, i) => ({ i, v }));
  return (
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke="#EC6425" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
