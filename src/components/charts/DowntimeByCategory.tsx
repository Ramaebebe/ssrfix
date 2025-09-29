"use client";
import { LineChart, Line, ResponsiveContainer } from "recharts";
export default function DowntimeByCategory(){
  const data = ["Tyres","Body","Service","Fuel"].map((k,i)=>({i,v: Math.random()*100+20}));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}><Line type="monotone" dataKey="v" stroke="#EC6425" strokeWidth={2} dot/></LineChart>
      </ResponsiveContainer>
    </div>
  );
}
