"use client";
import { FC } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
const data=[{name:"Week 1",value:92},{name:"Week 2",value:94},{name:"Week 3",value:93},{name:"Week 4",value:95}];
const AvailabilityChart: FC = () => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis domain={[0,100]}/><Tooltip/><Line type="monotone" dataKey="value" stroke="#EC6425" strokeWidth={2} dot={false}/></LineChart>
  </ResponsiveContainer>
);
export default AvailabilityChart;

