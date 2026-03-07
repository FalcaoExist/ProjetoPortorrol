import React, { useState } from "react";
import { useGridApiContext } from "@mui/x-data-grid";
import { Popover } from "@mui/material";
import { FiChevronDown, FiCheck } from "react-icons/fi";

export default function SupplierEditCell({ id, value, field, options }) {
  const apiRef = useGridApiContext();
  const [anchorEl, setAnchorEl] = useState(null);

  const selectedValues = Array.isArray(value) ? value : [];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const toggleOption = (option) => {
    const isSelected = selectedValues.includes(option);
    const nextSelection = isSelected
      ? selectedValues.filter((v) => v !== option)
      : [...selectedValues, option];

    const sortedNewValues = options.filter(opt => nextSelection.includes(opt));

    apiRef.current.setEditCellValue({ id, field, value: sortedNewValues });
  };

  const open = Boolean(anchorEl);

  return (
    <div className="w-full h-full relative">
      <div 
        onClick={handleClick}
        className="w-full h-full border border-gray-300 rounded-md px-2 py-1 text-sm font-poppins bg-white cursor-pointer flex items-center overflow-hidden hover:border-gray-400 transition-colors"
      >
        <span className="truncate text-gray-700">
          {selectedValues.length > 0 ? selectedValues.join(", ") : <span className="text-gray-400 italic">Selecione...</span>}
        </span>
        <FiChevronDown className="ml-auto text-gray-400 min-w-[14px]" size={14} />
      </div>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
            style: { minWidth: anchorEl ? anchorEl.clientWidth : 'auto', marginTop: '4px' }
        }}
      >
        <div className="p-1 bg-white rounded-md shadow-lg border border-gray-100 flex flex-col max-h-60 overflow-y-auto">
           {options.map((opt, idx) => {
             const isSelected = selectedValues.includes(opt);
             return (
               <div 
                 key={`${opt}-${idx}`} 
                 onClick={() => toggleOption(opt)}
                 className={`
                    px-3 py-2 cursor-pointer flex items-center gap-3 text-sm font-poppins rounded-md transition-colors select-none
                    ${isSelected ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50 text-gray-700'}
                 `}
               >
                 <div className={`
                    w-4 h-4 border rounded flex items-center justify-center transition-all flex-shrink-0
                    ${isSelected ? 'bg-[#5A44B0] border-[#5A44B0]' : 'border-gray-300 bg-white'}
                 `}>
                    {isSelected && <FiCheck size={10} className="text-white" />}
                 </div>
                 <span>{opt}</span>
               </div>
             );
           })}
        </div>
      </Popover>
    </div>
  );
}