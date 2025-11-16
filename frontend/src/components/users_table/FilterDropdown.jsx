import { FiX } from "react-icons/fi";
import { useClickOutside } from "../../hooks/useClickOutside";

// Campo genérico para filtros de texto.
function TextFilterControl({ value, placeholder, onChange }) {
    return (
        <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded border border-[#e5e7eb] px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-[#111827]"
        />
    );
}

// Dropdown compacto para filtros com opções fechadas.
function SelectFilterControl({ value, options = [], onChange }) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded border border-[#e5e7eb] px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-[#111827]"
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

// Mapeia o tipo declarado na coluna para o componente apropriado.
const CONTROL_MAP = {
    text: TextFilterControl,
    select: SelectFilterControl,
};

export default function FilterDropdown({ column, value, onChange, onClose }) {
    const dropdownRef = useClickOutside(onClose);
    const ControlComponent = CONTROL_MAP[column.filterType] ?? TextFilterControl;

    return (
        <div
            ref={dropdownRef}
            className="absolute left-0 top-full z-10 mt-2 w-56 rounded-lg border border-[#e5e7eb] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.1)]"
        >
            <div className="flex items-center justify-between px-3 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Filtrar {column.label}
                </p>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                >
                    <FiX size={16} />
                </button>
            </div>
            <div className="px-3 pb-3">
                {/* Componente específico herda props padrão de filtro */}
                <ControlComponent
                    value={value}
                    placeholder={column.placeholder}
                    options={column.options}
                    onChange={onChange}
                />
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="mt-2 w-full rounded border border-transparent bg-gray-100 py-1.5 text-xs font-medium uppercase tracking-wide text-gray-600 transition-colors hover:bg-gray-200"
                >
                    Limpar filtro
                </button>
            </div>
        </div>
    );
}
