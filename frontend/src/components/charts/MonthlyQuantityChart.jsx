import React, { useMemo } from "react";
import { LineChart, Line, Label, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";



const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 text-center">
        <div className="text-gray-400 text-sm">This Month</div>
        <div className="font-bold text-[28px] text-[#464255]">{payload[0].value} peças</div>
        <div className="text-gray-400 text-[14px]">{label}</div>
      </div>
    );
  }
  return null;
};

export default function MonthlyQuantityChart({ data, sku }) {

  const displayData = data || [];

  return (
    <div className="w-full h-[300px] min-h-[200px] bg-white rounded-[20px] p-6 relative">
      <ResponsiveContainer width="100%" height={270}>
        <LineChart data={displayData} margin={{ top: 30, right: 30, left: 10, bottom: 10 }}>
          <Label value="Dias de cobertura" angle={-90} position="left" dx={-60} style={{ textAnchor: 'middle' }} />
          <CartesianGrid vertical={false} stroke="#f2f2f2" />
          <XAxis dataKey="month" tick={{ fill: "#bdbdbd", fontSize: 14 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#bdbdbd", fontSize: 14 }} axisLine={false} tickLine={false} domain={[0, 900]} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#bdbdbd", strokeDasharray: "3 3" }} />
          <Line type="monotone" dataKey="value" stroke="#5E4D9E" strokeWidth={4} dot={{ r: 0, fill: "#fff", stroke: "#5E4D9E", strokeWidth: 3 }} activeDot={{ r: 10, fill: "#fff", stroke: "#5E4D9E", strokeWidth: 4 }} />
        </LineChart>
      </ResponsiveContainer>
      {sku && (
        <div className="absolute ml-8 mt-2">
          <div className="bg-white px-3 py-1 rounded-full text-sm shadow">{sku}</div>
        </div>
      )}
    </div>
  )
};


