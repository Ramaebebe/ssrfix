"use client";
import { LineChart, Line, ResponsiveContainer } from "recharts";
export default function AvailabilityChart(){
  const data = Array.from({length:30},(_,i)=>({d:i,v:90+Math.random()*10}));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}><Line type="monotone" dataKey="v" stroke="#EC6425" strokeWidth={2} dot={false}/></LineChart>
      </ResponsiveContainer>
    </div>
  );
}
