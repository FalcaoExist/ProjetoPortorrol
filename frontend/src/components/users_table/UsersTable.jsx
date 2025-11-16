import { useMemo, useState } from "react";
import { TbEdit } from "react-icons/tb";
import { MdBlockFlipped } from "react-icons/md";
import { FiX, FiChevronDown } from "react-icons/fi";
import FilterDropdown from "./FilterDropdown";

export default function UsersTable({ users = [] }) {
    const [filters, setFilters] = useState({
        name: "",
        email: "",
        supplier: "",
        active: ""
    });
    const [activeColumn, setActiveColumn] = useState(null);

    // Opções de fornecedores a partir dos dados
    const supplierOptions = useMemo(() => {
        return Array.from(
            new Set(users.map((row) => row.supplier).filter(Boolean))
        );
    }, [users]);
    
    // Opções de status (ativo ou nao) a partir dos dados
    const statusOptions = useMemo(() => {
        return Array.from(
            new Set(users.map((row) => row.active).filter(Boolean))
        );
    }, [users]);

    // Aplica os filtros em memória
    const filteredRows = useMemo(() => {
        return users.filter((row) => {
            const matchesName = !filters.name
                || row.name?.toLowerCase().includes(filters.name.toLowerCase());

            const matchesEmail = !filters.email
                || row.email?.toLowerCase().includes(filters.email.toLowerCase());

            const matchesSupplier = !filters.supplier
                || row.supplier === filters.supplier;

            const matchesActive = !filters.active
                || row.active === filters.active;

            return matchesName && matchesEmail && matchesSupplier && matchesActive;
        });
    }, [users, filters]);

    const handleFilterChange = (columnId, value) => {
        setFilters((previous) => ({ ...previous, [columnId]: value }));
    };

    const toggleDropdown = (columnId) => {
        setActiveColumn((previous) => (previous === columnId ? null : columnId));
    };

    const closeDropdown = () => setActiveColumn(null);  

    return (
        <div className="max-h-80 min-h-56 w-full overflow-y-auto">
            <table className="w-full border-collapse">
                <thead className="bg-white">
                    <tr>
                        {/* Analista de compras */}
                        <th className="sticky top-0 z-10 bg-white font-poppins font-normal text-start border-b-black">
                            <button
                                type="button"
                                onClick={() => toggleDropdown("name")}
                                className="flex w-full items-center gap-2 py-2 text-left text-[#111827] transition-colors hover:text-[#0ea5e9] border-b"
                            >
                                <span>Analista de compras</span>
                                <FiChevronDown
                                    size={14}
                                    className={`transition-transform ${
                                        activeColumn === "name" ? "rotate-180" : ""
                                    }`}
                                />
                            </button>
                            {activeColumn === "name" && (
                                <FilterDropdown
                                    column={{
                                        id: "name",
                                        label: "Analista de compras",
                                        filterType: "text",
                                        placeholder: "Digite um nome",
                                    }}
                                    value={filters.name}
                                    onChange={(value) => handleFilterChange("name", value)}
                                    onClose={closeDropdown}
                                />
                            )}
                        </th>

                        {/* Email */}
                        <th className="sticky top-0 z-10 bg-white font-poppins font-normal text-start">
                            <button
                                type="button"
                                onClick={() => toggleDropdown("email")}
                                className="flex w-full items-center gap-2 py-2 text-left text-[#111827] transition-colors hover:text-[#0ea5e9] border-b"
                            >
                                <span>email</span>
                                <FiChevronDown
                                    size={14}
                                    className={`transition-transform ${
                                        activeColumn === "email" ? "rotate-180" : ""
                                    }`}
                                />
                            </button>
                            {activeColumn === "email" && (
                                <FilterDropdown
                                    column={{
                                        id: "email",
                                        label: "email",
                                        filterType: "text",
                                        placeholder: "Buscar por email",
                                    }}
                                    value={filters.email}
                                    onChange={(value) => handleFilterChange("email", value)}
                                    onClose={closeDropdown}
                                />
                            )}
                        </th>

                        {/* Fornecedor */}
                        <th className="sticky top-0 z-10 bg-white font-poppins font-normal text-start">
                            <button
                                type="button"
                                onClick={() => toggleDropdown("supplier")}
                                className="flex w-full items-center gap-2 py-2 text-left text-[#111827] transition-colors hover:text-[#0ea5e9] border-b"
                            >
                                <span>Fornecedor</span>
                                <FiChevronDown
                                    size={14}
                                    className={`transition-transform ${
                                        activeColumn === "supplier" ? "rotate-180" : ""
                                    }`}
                                />
                            </button>
                            {activeColumn === "supplier" && (
                                <FilterDropdown
                                    column={{
                                        id: "supplier",
                                        label: "Fornecedor",
                                        filterType: "select",
                                        placeholder: "Selecione o fornecedor",
                                        options: supplierOptions,
                                    }}
                                    value={filters.supplier}
                                    onChange={(value) => handleFilterChange("supplier", value)}
                                    onClose={closeDropdown}
                                />
                            )}
                        </th>
                        {/* Ativo */}
                        <th className="sticky top-0 z-10 bg-white font-poppins font-normal text-start">
                            <button
                                type="button"
                                onClick={() => toggleDropdown("active")}
                                className="flex w-full items-center gap-2 py-2 text-left text-[#111827] transition-colors hover:text-[#0ea5e9] border-b"
                            >
                                <span>Status</span>
                                <FiChevronDown
                                    size={14}
                                    className={`transition-transform ${
                                        activeColumn === "active" ? "rotate-180" : ""
                                    }`}
                                />
                            </button>
                            {activeColumn === "active" && (
                                <FilterDropdown
                                    column={{
                                        id: "active",
                                        label: "Status",
                                        filterType: "select",
                                        placeholder: "Selecione o status",
                                        options: statusOptions,
                                    }}
                                    value={filters.active}
                                    onChange={(value) => handleFilterChange("active", value)}
                                    onClose={closeDropdown}
                                />
                            )}
                        </th>

                        <th className="sticky top-0 z-10 bg-white" />
                    </tr>
                </thead>

                <tbody>
                    {filteredRows.length === 0 && (
                        <tr>
                            <td
                                className="py-6 text-center text-sm text-gray-400"
                                colSpan={4}
                            >
                                Nenhum registro encontrado com os filtros atuais.
                            </td>
                        </tr>
                    )}

                    {filteredRows.map((row) => (
                        <tr key={row.id}>
                            <td className="text-sm font-poppins text-start text-[#111827]">
                                {row.name}
                            </td>
                            <td className="text-sm font-poppins text-start text-[#111827]">
                                {row.email}
                            </td>
                            <td className="text-sm font-poppins text-start text-[#111827]">
                                {row.supplier}
                            </td>
                            <td className="text-sm font-poppins text-start text-[#111827]">
                                {row.active}
                            </td>
                            <td>
                                <div className="flex flex-row gap-2 text-[#111827]">
                                    <button type="button" className="p-1 text-[#111827] hover:text-[#0ea5e9]">
                                        <TbEdit size="20px" />
                                    </button>
                                    <button type="button" className="p-1 text-[#111827] hover:text-[#f97316]">
                                        <MdBlockFlipped size="18px" />
                                    </button>
                                    <button type="button" className="p-1 text-[#111827] hover:text-[#ef4444]">
                                        <FiX size="21px" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}