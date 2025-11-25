import React from "react";
import { FiX } from "react-icons/fi";
import DateFilterControl from "./DateFilterControl";

// --- SUB-COMPONENTES ---

// Renderiza um input de texto simples
function TextFilterControl({ value, placeholder, onChange }) {
    return (
        <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            autoFocus
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-poppins placeholder-gray-400 transition-shadow"
        />
    );
}

// Renderiza um dropdown (select)
function SelectFilterControl({ value, options = [], onChange }) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-poppins bg-white cursor-pointer transition-shadow"
        >
            <option value="">Todos</option>
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
}

// Mapeamento para escolher qual componente renderizar baseado no tipo de filtro da coluna
const CONTROL_MAP = {
    text: TextFilterControl,
    select: SelectFilterControl,
    date: DateFilterControl,
};

// --- COMPONENTE PRINCIPAL ---
export default function FilterPopoverContent({ column, value, onChange, onClose }) {
    // Decide qual input mostrar (texto, select ou data)
    const ControlComponent = CONTROL_MAP[column.filterType] ?? TextFilterControl;

    // Formata o título do filtro
    const title = column.label ? `FILTRAR ${column.label}` : "FILTRAR";

    return (
        // Container principal da caixa de filtro (Estilização visual)
        <div className="w-60 bg-white rounded-lg shadow-xl border border-gray-100 font-poppins flex flex-col">
            
            {/* Cabeçalho com Título e Botão Fechar */}
            <div className="flex items-start justify-between p-3 pb-2">
                <span className="text-[0.7rem] font-bold text-gray-500 uppercase tracking-wider leading-snug pr-2">
                    {title}
                </span>
                
                <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 flex-shrink-0 -mt-1"
                >
                    <FiX size={14} />
                </button>
            </div>

            {/* Corpo com o Input e Botão Limpar */}
            <div className="px-3 pb-3 flex flex-col gap-3">
                <div className="w-full">
                    <ControlComponent
                        value={value}
                        placeholder={column.placeholder}
                        options={column.options}
                        onChange={onChange}
                    />
                </div>

                <button
                    type="button"
                    onClick={() => {
                        onChange(""); // Limpa o valor do filtro
                        onClose();    // Fecha o popover
                    }}
                    className="w-full rounded py-1.5 text-[0.75rem] font-semibold uppercase tracking-wide text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                    Limpar filtro
                </button>
            </div>
        </div>
    );
}