import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { month: "Jan/24", value: 220 },
  { month: "Fev/24", value: 370 },
  { month: "Mar/24", value: 400 },
  { month: "Abr/24", value: 350 },
  { month: "Mai/24", value: 330 },
  { month: "Jun/24", value: 420 },
  { month: "Jul/24", value: 600 },
  { month: "Ago/24", value: 700 },
  { month: "Set/24", value: 800 },
  { month: "Out/24", value: 650 },
  { month: "Nov/24", value: 752 },
  { month: "Dez/24", value: 500 },
  { month: "Jan/25", value: 300 },
  { month: "Fev/25", value: 410 },
  { month: "Mar/25", value: 420 },
  { month: "Abr/25", value: 390 },
  { month: "Mai/25", value: 350 },
  { month: "Jun/25", value: 480 },
  { month: "Jul/25", value: 700 },
  { month: "Ago/25", value: 820 },
  { month: "Set/25", value: 870 },
  { month: "Out/25", value: 690 },
  { month: "Nov/25", value: 752 },
  { month: "Dez/25", value: 510 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "white", borderRadius: 12, boxShadow: "0 2px 8px #eee", padding: 20, textAlign: "center" }}>
        <div style={{ color: "#bdbdbd", fontSize: 12 }}>This Month</div>
        <div style={{ fontWeight: 700, fontSize: 28, color: "#464255" }}>{payload[0].value} peças</div>
        <div style={{ color: "#bdbdbd", fontSize: 14 }}>{label}</div>
      </div>
    );
  }
  return null;
};

const MonthlyQuantityChart = () => (
  <div style={{ width: "100%", height: 300, background: "#fff", borderRadius: 20, padding: 24 }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 30, right: 30, left: 10, bottom: 10 }}>
        <CartesianGrid vertical={false} stroke="#f2f2f2" />
        <XAxis dataKey="month" tick={{ fill: "#bdbdbd", fontSize: 14 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#bdbdbd", fontSize: 14 }} axisLine={false} tickLine={false} domain={[0, 900]} />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#bdbdbd", strokeDasharray: "3 3" }} />
        <Line type="monotone" dataKey="value" stroke="#4a3aff" strokeWidth={4} dot={{ r: 6, fill: "#fff", stroke: "#4a3aff", strokeWidth: 3 }} activeDot={{ r: 10, fill: "#fff", stroke: "#4a3aff", strokeWidth: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default MonthlyQuantityChart;
