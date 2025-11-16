import { useState } from "react";

export default function SuppliersTable() {
    const [suppliers, setSuppliers] = useState([
        { id: 1, name: "Timken", start: "2025-12-01", end: "2026-01-01", budget: 60000, leadtime: 15, editing: false },
        { id: 2, name: "NSK", start: "2025-12-01", end: "2026-01-01", budget: 30000, leadtime: 9, editing: false },
        { id: 3, name: "FRM", start: "2025-12-01", end: "2026-01-01", budget: 30000, leadtime: 9, editing: false },
        { id: 4, name: "BGL", start: "2025-12-01", end: "2026-01-01", budget: 10000, leadtime: 7, editing: false },
        { id: 5, name: "IKO", start: "2025-12-01", end: "2026-01-01", budget: 45000, leadtime: 20, editing: false },
        { id: 6, name: "SAV", start: "2025-12-01", end: "2026-01-01", budget: 45000, leadtime: 20, editing: false },
    ]);

    const [newId, setNewId] = useState(7);

    const handleAdd = () => {
        setSuppliers([
            ...suppliers,
            {
                id: newId,
                name: "",
                start: "",
                end: "",
                budget: "",
                leadtime: "",
                editing: true,
                isNew: true
            }
        ]);
        setNewId(newId + 1);
    };

    const handleEdit = (id) => {
        setSuppliers(suppliers.map(s =>
            s.id === id ? { ...s, editing: true } : s
        ));
    };

    const handleSave = (id) => {
        setSuppliers(suppliers.map(s =>
            s.id === id ? { ...s, editing: false, isNew: false } : s
        ));
    };

    const handleDelete = (id) => {
        setSuppliers(suppliers.filter(s => s.id !== id));
    };

    const handleCancel = (id) => {
        const supplier = suppliers.find(s => s.id === id);
        if (supplier.isNew) {
            handleDelete(id);
            return;
        }

        setSuppliers(suppliers.map(s =>
            s.id === id ? { ...s, editing: false } : s
        ));
    };

    const handleChange = (id, field, value) => {
        setSuppliers(suppliers.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    return (
        <div className="overflow-x-auto mt-4 rounded-lg shadow-md">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-left text-gray-600 font-poppins">
                    <tr>
                        <th className="p-4">Fornecedor</th>
                        <th className="p-4">Início</th>
                        <th className="p-4">Fim</th>
                        <th className="p-4">Orçamento (R$)</th>
                        <th className="p-4">Leadtime</th>
                        <th className="p-4 text-center">Ações</th>
                    </tr>
                </thead>

                <tbody className="text-gray-700">
                    {suppliers.map(s => (
                        <tr key={s.id} className="border-b hover:bg-gray-50">
                            
                            {/* Nome (não editável) */}
                            <td className="p-4">
                                {s.isNew ? (
                                    <input
                                        type="text"
                                        className="border p-1 rounded"
                                        placeholder="Fornecedor"
                                        value={s.name}
                                        onChange={e => handleChange(s.id, "name", e.target.value)}
                                    />
                                ) : (
                                    s.name
                                )}
                            </td>

                            {/* Início */}
                            <td className="p-4">
                                {s.editing ? (
                                    <input
                                        type="date"
                                        className="border p-1 rounded"
                                        value={s.start}
                                        onChange={e => handleChange(s.id, "start", e.target.value)}
                                    />
                                ) : (
                                    new Date(s.start).toLocaleDateString("pt-BR")
                                )}
                            </td>

                            {/* Fim */}
                            <td className="p-4">
                                {s.editing ? (
                                    <input
                                        type="date"
                                        className="border p-1 rounded"
                                        value={s.end}
                                        onChange={e => handleChange(s.id, "end", e.target.value)}
                                    />
                                ) : (
                                    new Date(s.end).toLocaleDateString("pt-BR")
                                )}
                            </td>

                            {/* Orçamento */}
                            <td className="p-4">
                                {s.editing ? (
                                    <input
                                        type="number"
                                        className="border p-1 rounded w-24"
                                        value={s.budget}
                                        onChange={e => handleChange(s.id, "budget", e.target.value)}
                                    />
                                ) : (
                                    s.budget.toLocaleString("pt-BR")
                                )}
                            </td>

                            {/* Leadtime */}
                            <td className="p-4">
                                {s.editing ? (
                                    <input
                                        type="number"
                                        className="border p-1 rounded w-20"
                                        value={s.leadtime}
                                        onChange={e => handleChange(s.id, "leadtime", e.target.value)}
                                    />
                                ) : (
                                    `${s.leadtime} dias`
                                )}
                            </td>

                            {/* Ações */}
                            <td className="p-4 flex items-center justify-center gap-4">

                                {s.editing ? (
                                    <>
                                        {/* Salvar */}
                                        <button onClick={() => handleSave(s.id)}>
                                            <svg width="18" height="18" stroke="black" strokeWidth="2" fill="none" viewBox="0 0 24 24">
                                                <path d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>

                                        {/* Cancelar */}
                                        <button onClick={() => handleCancel(s.id)}>
                                            <svg width="18" height="18" stroke="black" strokeWidth="2" fill="none" viewBox="0 0 24 24">
                                                <path d="M4 4 L16 16 M16 4 L4 16" />
                                            </svg>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {/* Editar */}
                                        <button onClick={() => handleEdit(s.id)}>
                                            <svg width="18" height="18" fill="none" stroke="black" strokeWidth="1.6" viewBox="0 0 24 24">
                                                <path d="M12 20h9" />
                                                <path d="M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z" />
                                            </svg>
                                        </button>

                                        {/* Excluir */}
                                        <button onClick={() => handleDelete(s.id)}>
                                            <svg width="18" height="18" fill="none" stroke="black" strokeWidth="2" viewBox="0 0 24 24">
                                                <path d="M4 4 L16 16 M16 4 L4 16" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button
                onClick={handleAdd}
                className="bg-[#5A44B0] hover:bg-white text-white hover:text-black shadow-lg font-poppins uppercase text-sm p-2 rounded-md mt-6"
            >
                Adicionar Fornecedor
            </button>
        </div>
    );
}
