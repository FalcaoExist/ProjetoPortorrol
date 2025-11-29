import React, { useState } from "react";
import { useGridApiContext } from "@mui/x-data-grid";
import { Popover } from "@mui/material";
import { FiChevronDown, FiCheck } from "react-icons/fi";

// ---------------------------------------------------------------------------
// COMPONENTE: SupplierEditCell
// ---------------------------------------------------------------------------
export default function SupplierEditCell({ id, value, field, options }) {
  const apiRef = useGridApiContext();
  const [anchorEl, setAnchorEl] = useState(null);

  // Garante que o valor seja sempre um array para evitar erros
  const selectedValues = Array.isArray(value) ? value : [];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Lógica de toggle para adicionar/remover item
  const toggleOption = (option) => {
    // 1. Descobre quais itens o usuário QUER ter selecionados (sem se preocupar com ordem ainda)
    const isSelected = selectedValues.includes(option);
    const nextSelection = isSelected
      ? selectedValues.filter((v) => v !== option) // Remove
      : [...selectedValues, option]; // Adiciona temporariamente

    // 2. [CORREÇÃO DEFINITIVA DE ORDEM]
    // Em vez de ordenar o array bagunçado, nós percorremos a lista ORIGINAL de 'options' (que já está na ordem certa)
    // e pegamos apenas o que está na seleção do usuário.
    // Isso garante que o resultado final SEMPRE siga a ordem do menu.
    const sortedNewValues = options.filter(opt => nextSelection.includes(opt));

    // Atualiza a grid com o valor já ordenado
    apiRef.current.setEditCellValue({ id, field, value: sortedNewValues });
  };

  const open = Boolean(anchorEl);

  return (
    <div className="w-full h-full relative">
      {/* Campo Visual (Input fake) */}
      <div 
        onClick={handleClick}
        className="w-full h-full border border-gray-300 rounded-md px-2 py-1 text-sm font-poppins bg-white cursor-pointer flex items-center overflow-hidden hover:border-gray-400 transition-colors"
      >
        <span className="truncate text-gray-700">
          {selectedValues.length > 0 ? selectedValues.join(", ") : <span className="text-gray-400 italic">Selecione...</span>}
        </span>
        <FiChevronDown className="ml-auto text-gray-400 min-w-[14px]" size={14} />
      </div>
      
      {/* Menu Flutuante */}
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
           {options.map((opt) => {
             const isSelected = selectedValues.includes(opt);
             return (
               <div 
                 key={opt} 
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