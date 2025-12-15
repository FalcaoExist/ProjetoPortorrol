import React from "react";

export default function LeadtimeSavingCard({ leadtime = 15, saving = 8 }) {
  return (
    <div className="border border-[#e5e5e5] rounded-xl p-4 w-44 h-32 flex flex-col items-center justify-center shadow-sm bg-white">
      <span className="text-xs text-[#464255] font-poppins">Leadtime médio</span>
      <span className="text-2xl font-bold text-[#2d253b] font-poppins leading-tight">{leadtime} dias</span>
      <span className="text-sm text-[#464255] font-poppins mt-1">Saving</span>
      <span className="text-xl font-bold text-[#2d253b] font-poppins">{saving}%</span>
    </div>
  );
}