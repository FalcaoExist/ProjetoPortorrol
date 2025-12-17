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
    <div className="flex items-center gap-3 bg-white border border-[#e5e5e5] rounded-xl p-4 w-full min-w-0 h-full">
      {/* Gráfico pequeno: visível em telas pequenas */}
      <div className="w-16 h-16 flex items-center justify-center md:hidden">
        <PieChart width={64} height={64}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={20}
            outerRadius={30}
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

      {/* Gráfico grande: visível em telas médias e maiores */}
      <div className="hidden md:flex w-24 h-24 md:w-32 md:h-32 items-center justify-center">
        <PieChart width={96} height={96}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={45}
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
      <div className="min-w-0">
        <div className="text-base md:text-2xl font-bold text-primary font-poppins truncate">
          {formatCurrency(value)}
        </div>
        <div className="text-[#6B7280] text-xs md:text-base font-poppins truncate">
          <span className="font-semibold">Orçamento:</span> {formatCurrency(budget)}
        </div>
        <div className="text-xs md:text-sm text-[#A0AEC0] font-poppins truncate">
          De {startDate} a {endDate}
        </div>
      </div>
    </div>
  );
}
