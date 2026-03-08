import React from "react";
import { useSupplierLeadtimes } from "../../hooks/useSupplierLeadtimes";
import { FiLoader } from "react-icons/fi";

const BranchLeadtime = ({ branchName, leadtime, isLoading, hasSupplier }) => {
  const displayValue = () => {
    if (isLoading) return <FiLoader className="inline-block ml-2 animate-spin" />;
    if (!hasSupplier) return <span className="text-gray-500">- dias</span>;
    return <span className="font-bold text-gray-800">{leadtime ?? 0} dias</span>;
  };

  return (
    <div className="text-center text-sm text-gray-800">
      <span className="font-semibold">{branchName}: </span>
      {displayValue()}
    </div>
  );
};

export default function LeadtimeSavingCard({ supplier }) {
  const { leadtimes, isLoading } = useSupplierLeadtimes(supplier);
  const hasSupplier = Boolean(supplier);

  return (
    <div className="border border-[#e5e5e5] rounded-xl p-4 flex flex-col justify-center shadow-sm bg-white w-full min-w-0 h-full">
      <h3 className="text-md md:text-lg text-[#464255] font-poppins font-bold text-center mb-2">Leadtime por filial</h3>
      <div className="space-y-2 px-3">
        <BranchLeadtime 
          branchName="Porto Alegre" 
          leadtime={leadtimes["Porto Alegre"]}
          isLoading={isLoading}
          hasSupplier={hasSupplier}
        />
        <BranchLeadtime 
          branchName="Joinville" 
          leadtime={leadtimes["Joinville"]}
          isLoading={isLoading}
          hasSupplier={hasSupplier}
        />
        <BranchLeadtime 
          branchName="São Paulo" 
          leadtime={leadtimes["São Paulo"]}
          isLoading={isLoading}
          hasSupplier={hasSupplier}
        />
      </div>
    </div>
  );
}