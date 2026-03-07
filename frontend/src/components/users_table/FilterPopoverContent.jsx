import React from "react";
import { FiX, FiCheck } from "react-icons/fi";
import DateFilterControl from "./DateFilterControl";

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

function SelectFilterControl({ value, options = [], onChange }) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-poppins bg-white cursor-pointer transition-shadow"
        >
            <option value="">Todos</option>
            {options.map((option, idx) => {
                const optValue = typeof option === 'object' && option !== null ? option.value : option;
                const optLabel = typeof option === 'object' && option !== null ? option.label : option;
                return (
                    <option key={`${optValue}-${idx}`} value={optValue}>
                        {optLabel}
                    </option>
                );
            })}
        </select>
    );
}

function MultiSelectFilterControl({ value = [], options = [], onChange }) {
    const selectedValues = Array.isArray(value) ? value : [];

    const toggleOption = (option) => {
        const optValue = typeof option === 'object' && option !== null ? option.value : option;
        const newValues = selectedValues.includes(optValue)
            ? selectedValues.filter((v) => v !== optValue)
            : [...selectedValues, optValue];
        onChange(newValues);
    };

    return (
        <div className="max-h-48 overflow-y-auto border border-gray-300 rounded p-1 bg-gray-50">
            {options.length > 0 ? options.map((option, idx) => {
                if (!option) return null;
                const optValue = typeof option === 'object' && option !== null ? option.value : option;
                const optLabel = typeof option === 'object' && option !== null ? option.label : option;
                const isSelected = selectedValues.includes(optValue);
                return (
                    <div
                        key={`${optValue}-${idx}`}
                        onClick={() => toggleOption(option)}
                        className={`
                            px-3 py-2 cursor-pointer flex items-center gap-3 text-sm font-poppins rounded-md transition-colors select-none
                            ${isSelected ? 'bg-blue-50 text-blue-800' : 'hover:bg-white text-gray-700'}
                        `}
                    >
                        <div className={`
                            w-4 h-4 border rounded flex items-center justify-center transition-all flex-shrink-0
                            ${isSelected ? 'bg-[#5A44B0] border-[#5A44B0]' : 'border-gray-400 bg-white'}
                        `}>
                            {isSelected && <FiCheck size={10} className="text-white" />}
                        </div>
                        <span className="truncate">{optLabel}</span>
                    </div>
                );
            }) : (
                <div className="p-2 text-xs text-gray-500 text-center">Nenhuma opção disponível</div>
            )}
        </div>
    );
}

const CONTROL_MAP = {
    text: TextFilterControl,
    select: SelectFilterControl,
    date: DateFilterControl,
    multiSelect: MultiSelectFilterControl,
};

export default function FilterPopoverContent({ column, value, onChange, onClose }) {
    const ControlComponent = CONTROL_MAP[column.filterType] ?? TextFilterControl;
    const title = column.label ? `FILTRAR ${column.label}` : "FILTRAR";

    return (
        <div className="w-60 bg-white rounded-lg shadow-xl border border-gray-100 font-poppins flex flex-col">
            
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
                        onChange("");
                        onClose();
                    }}
                    className="w-full rounded py-1.5 text-[0.75rem] font-semibold uppercase tracking-wide text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                    Limpar filtro
                </button>
            </div>
        </div>
    );
}