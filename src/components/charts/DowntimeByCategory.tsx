"use client";
import { FC } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
const data=[{name:"Maintenance",value:120},{name:"Accidents",value:80},{name:"Tyres",value:60},{name:"Other",value:52}];
const COLORS=["#EC6425","#C7511E","#A13F18","#7B2D12"];
const DowntimeByCategory: FC = () => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{data.map((_,i)=>(<Cell key={`cell-${i}`} fill={COLORS[i%COLORS.length]} />))}</Pie><Tooltip/></PieChart>
  </ResponsiveContainer>
);
export default DowntimeByCategory;
