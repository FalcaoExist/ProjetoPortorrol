import React from "react";
import { PieChart, Pie, Cell } from "recharts";

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export default function BudgetProgressCard({ value, budget, startDate, endDate }) {
  const percentage = Math.min((value / budget) * 100, 100);
  const data = [
    { name: "Gasto", value: percentage },
    { name: "Restante", value: 100 - percentage },
  ];
  const COLORS = ["#232A5C", "#E5E5E5"];

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl shadow p-4 min-w-[300px]">
      <div className="w-24 h-24 flex items-center justify-center">
        <PieChart width={96} height={96}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={32}
            outerRadius={48}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
      </div>
      <div>
        <div className="text-2xl font-bold text-[#232A5C] font-poppins">
          {formatCurrency(value)}
        </div>
        <div className="text-[#6B7280] text-sm font-poppins">
          <span className="font-semibold">Orçamento:</span> {formatCurrency(budget)}
        </div>
        <div className="text-xs text-[#A0AEC0] font-poppins">
          De {startDate} a {endDate}
        </div>
      </div>
    </div>
  );
}
