import { useMemo, useState, useEffect } from "react";
import { TbEdit } from "react-icons/tb";
import { MdBlockFlipped } from "react-icons/md";
import { FiX, FiChevronDown, FiCheck } from "react-icons/fi";
import FilterDropdown from "./FilterDropdown";

export default function UsersTable({ users = [] }) {
    // local copy dos usuários para permitir edição/remover no frontend
    const [rows, setRows] = useState([
        {
            id: 1,
            name: "Maria Silva",
            email: "maria.silva@empresa.com",
            supplier: "Timken",
            status: "Ativo",
            editing: false,
        }
    ]);

    // Sincroniza se o prop users mudar (opcional — útil durante desenvolvimento)
    // useEffect(() => {
    //     setRows(users.map((u) => ({ ...u, editing: false })));
    // }, [users]);

    // filtros do topo
    const [filters, setFilters] = useState({
        name: "",
        email: "",
        supplier: "",
        active: ""
    });
    const [activeColumn, setActiveColumn] = useState(null);

    // supplierOptions hardcoded (opção B escolhida)
    const supplierOptions = useMemo(() => {
        return ["Timken", "SKF", "Gerdau", "Vogel", "Gates"];
    }, []);

    // statusOptions extraídas dos dados (mantive porque o dropdown de filtro usa)
    const statusOptions = useMemo(() => {
        return Array.from(new Set(users.map((row) => row.active).filter(Boolean)));
    }, [users]);

    // Aplicar filtros em memória
    const filteredRows = useMemo(() => {
        return rows.filter((row) => {
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
    }, [rows, filters]);

    const handleFilterChange = (columnId, value) => {
        setFilters((previous) => ({ ...previous, [columnId]: value }));
    };

    const toggleDropdown = (columnId) => {
        setActiveColumn((previous) => (previous === columnId ? null : columnId));
    };

    const closeDropdown = () => setActiveColumn(null);

    // --- edição inline ---
    const handleEdit = (id) => {
        setRows(rows.map(r => r.id === id ? { ...r, editing: true, _backup: { ...r } } : r));
    };

    const handleCancel = (id) => {
        setRows(rows.map(r => {
            if (r.id !== id) return r;
            // restore backup (se existir)
            if (r._backup) {
                const restored = { ...r._backup, editing: false };
                delete restored._backup;
                return restored;
            }
            return { ...r, editing: false };
        }));
    };

    const handleSave = (id) => {
        setRows(rows.map(r => r.id === id ? { ...r, editing: false, _backup: undefined } : r));
        // aqui você pode disparar integração com backend futuramente
    };

    const handleDelete = (id) => {
        const row = rows.find(r => r.id === id);
        if (!row) return;
        const confirmed = window.confirm(`Remover usuário "${row.name}"?`);
        if (!confirmed) return;
        setRows(rows.filter(r => r.id !== id));
    };

    const handleChange = (id, field, value) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

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
                                    className={`transition-transform ${ activeColumn === "name" ? "rotate-180" : "" }`}
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
                                    className={`transition-transform ${ activeColumn === "email" ? "rotate-180" : "" }`}
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
                                    className={`transition-transform ${ activeColumn === "supplier" ? "rotate-180" : "" }`}
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
                                    className={`transition-transform ${ activeColumn === "active" ? "rotate-180" : "" }`}
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
                                colSpan={5}
                            >
                                Nenhum registro encontrado com os filtros atuais.
                            </td>
                        </tr>
                    )}

                    {filteredRows.map((row) => (
                        <tr key={row.id} className="border-b hover:bg-gray-50">
                            {/* Nome */}
                            <td className="text-sm font-poppins text-start text-[#111827] p-3">
                                {row.editing ? (
                                    <input
                                        type="text"
                                        value={row.name}
                                        onChange={(e) => handleChange(row.id, "name", e.target.value)}
                                        className="w-full border rounded px-2 py-1 text-sm"
                                    />
                                ) : (
                                    row.name
                                )}
                            </td>

                            {/* Email */}
                            <td className="text-sm font-poppins text-start text-[#111827] p-3">
                                {row.editing ? (
                                    <input
                                        type="email"
                                        value={row.email}
                                        onChange={(e) => handleChange(row.id, "email", e.target.value)}
                                        className="w-full border rounded px-2 py-1 text-sm"
                                    />
                                ) : (
                                    row.email
                                )}
                            </td>

                            {/* Fornecedor */}
                            <td className="text-sm font-poppins text-start text-[#111827] p-3">
                                {row.editing ? (
                                    <select
                                        value={row.supplier || ""}
                                        onChange={(e) => handleChange(row.id, "supplier", e.target.value)}
                                        className="w-full border rounded px-2 py-1 text-sm"
                                    >
                                        <option value="">-- selecione --</option>
                                        {supplierOptions.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                ) : (
                                    row.supplier
                                )}
                            </td>

                            {/* Status */}
                            <td className="text-sm font-poppins text-start text-[#111827] p-3">
                                {row.editing ? (
                                    <select
                                        value={row.active || ""}
                                        onChange={(e) => handleChange(row.id, "active", e.target.value)}
                                        className="w-full border rounded px-2 py-1 text-sm"
                                    >
                                        <option value="">-- selecione --</option>
                                        <option value="Ativo">Ativo</option>
                                        <option value="Inativo">Inativo</option>
                                    </select>
                                ) : (
                                    row.active
                                )}
                            </td>

                            {/* Ações */}
                            <td className="p-3">
                                <div className="flex flex-row gap-2 text-[#111827]">
                                    {row.editing ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleSave(row.id)}
                                                className="p-1 text-[#10b981] hover:opacity-80"
                                                title="Salvar"
                                            >
                                                <FiCheck size={18} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleCancel(row.id)}
                                                className="p-1 text-[#ef4444] hover:opacity-80"
                                                title="Cancelar"
                                            >
                                                <FiX size={18} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(row.id)}
                                                className="p-1 text-[#111827] hover:text-[#0ea5e9]"
                                                title="Editar"
                                            >
                                                <TbEdit size={20} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(row.id)}
                                                className="p-1 text-[#111827] hover:text-[#ef4444]"
                                                title="Excluir"
                                            >
                                                <FiX size={20} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
