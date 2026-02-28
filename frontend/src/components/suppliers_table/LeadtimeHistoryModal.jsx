import React, { useMemo, useState } from "react";
import { FiClock, FiX, FiEdit2, FiCheck } from "react-icons/fi";
import { GridToolbarQuickFilter } from "@mui/x-data-grid";
import { BaseDataGrid } from "../common/BaseDataGrid";
import { useSnapshotForm } from "../../hooks/useSnapshotForm";

const normalizeHistoryRows = (history, supplierId) => {
    if (!history) return [];
    return history.map((entry, index) => ({
        ...entry,
        id: entry.id || `${supplierId || "s"}-${index}`,
    }));
};

const initialBranchLeadtimes = [
    { id: 1, name: "Porto Alegre", days: 15 },
    { id: 2, name: "São Paulo", days: 10 },
    { id: 3, name: "Joinville", days: 16 },
];

const historyColumns = [
    {
        field: "recordedAt",
        headerName: "Atualizado em",
        type: "date",
        minWidth: 140,
        flex: 0.9,
        valueFormatter: (value) => (value ? new Date(value).toLocaleDateString("pt-BR") : ""),
        headerAlign: "center",
        align: "center",
    },
    {
        field: "start",
        headerName: "Início",
        type: "date",
        minWidth: 130,
        flex: 0.9,
        valueFormatter: (value) => (value ? new Date(value).toLocaleDateString("pt-BR") : ""),
        headerAlign: "center",
        align: "center",
    },
    {
        field: "end",
        headerName: "Fim",
        type: "date",
        minWidth: 130,
        flex: 0.9,
        valueFormatter: (value) => (value ? new Date(value).toLocaleDateString("pt-BR") : ""),
        headerAlign: "center",
        align: "center",
    },
    {
        field: "budget",
        headerName: "Orçamento (R$)",
        type: "number",
        minWidth: 150,
        flex: 1,
        valueFormatter: (value) => (value != null ? Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""),
        headerAlign: "center",
        align: "center",
    },
    {
        field: "leadtime",
        headerName: "Leadtime",
        type: "number",
        minWidth: 120,
        flex: 0.7,
        valueFormatter: (value) => (value != null ? `${value} dias` : ""),
        headerAlign: "center",
        align: "center",
    },
    {
        field: "notes",
        headerName: "Observações",
        minWidth: 220,
        flex: 1.6,
        sortable: false,
        headerAlign: "center",
        cellClassName: "cell-notes",
        renderCell: (params) => (
            <div className="whitespace-normal break-words leading-5">
                {params.value || ""}
            </div>
        ),
    },
];

export default function LeadtimeHistoryModal({
    isOpen = false,
    onClose = () => {},
    supplier,
    history = [],
    onRegisterCurrentSnapshot = () => ({}),
    columnsConfig = historyColumns,
}) {
    const { notes, setNotes, status, handleRegister } = useSnapshotForm({
        onSubmit: (selectedSupplier, noteText) => onRegisterCurrentSnapshot(selectedSupplier?.id, noteText),
        isOpen,
    });

    const [branchLeadtimes, setBranchLeadtimes] = useState(initialBranchLeadtimes);
    const [editingBranchId, setEditingBranchId] = useState(null);
    const [tempLeadtime, setTempLeadtime] = useState("");

    const handleEdit = (branch) => {
        setEditingBranchId(branch.id);
        setTempLeadtime(branch.days);
    };

    const handleSave = (branchId) => {
        setBranchLeadtimes(branchLeadtimes.map(b => b.id === branchId ? { ...b, days: Number(tempLeadtime) } : b));
        setEditingBranchId(null);
        setTempLeadtime("");
    };

    const rows = useMemo(() => normalizeHistoryRows(history, supplier?.id), [history, supplier]);
    const columns = useMemo(() => columnsConfig, [columnsConfig]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl animate-fade-in flex flex-col max-h-[90vh]">
                
                <div className="flex items-center justify-between gap-4 p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-purple-50 text-[#5A44B0]">
                            <FiClock size={22} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Leadtime do Fornecedor</p>
                            <h2 className="text-lg font-bold text-gray-900 font-poppins">{supplier?.name || "Fornecedor"}</h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar modal"
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                
                <div className="overflow-y-auto p-6 space-y-4">
                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                        <h3 className="text-md font-semibold text-gray-800 mb-3 font-poppins">Leadtime por Filial</h3>
                        <div className="space-y-2">
                            {branchLeadtimes.map((branch) => (
                                <div key={branch.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100">
                                    {editingBranchId === branch.id ? (
                                        <>
                                            <span className="font-medium text-gray-700">{branch.name}:</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={tempLeadtime}
                                                    onChange={(e) => setTempLeadtime(e.target.value)}
                                                    className="w-24 px-2 py-1 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#5A44B0]"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSave(branch.id)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleSave(branch.id)}
                                                    className="p-1.5 text-green-600 hover:bg-green-100 rounded-md"
                                                    aria-label="Salvar"
                                                >
                                                    <FiCheck size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingBranchId(null)}
                                                    className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md"
                                                    aria-label="Cancelar"
                                                >
                                                    <FiX size={16} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-medium text-gray-700">{branch.name}: <span className="font-normal">{branch.days} dias</span></span>
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(branch)}
                                                className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md"
                                                aria-label="Editar"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Histórico de leadtime</p>
                        <p className="text-sm text-gray-600 mt-1">
                            Consulte os registros anteriores de leadtime e demais parâmetros do fornecedor.
                        </p>
                    </div>


                    <div className="flex flex-col md:flex-row gap-3 md:items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Observações do registro</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ex.: Registrar valores atuais antes de alterar"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A44B0]"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => handleRegister(supplier)}
                            className="px-4 py-2.5 rounded-xl bg-[#f43629] text-white font-medium shadow hover:bg-[#f43460] transition"
                        >
                            Registrar dados atuais
                        </button>
                    </div>

                    {status.message && (
                        <div
                            className={`px-4 py-3 rounded-lg text-sm font-medium ${status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                        >
                            {status.message}
                        </div>
                    )}

                    <div className="border border-gray-100 rounded-xl bg-gray-50/50 p-3">
                        <BaseDataGrid
                            rows={rows}
                            columns={columns}
                            headerStyle="alternative"
                            disableColumnFilter={false}
                            disableColumnMenu={false}
                            sx={{ height: 400, width: '100%' }}
                            slots={{
                                toolbar: GridToolbarQuickFilter,
                            }}
                            slotProps={{
                                toolbar: {
                                    quickFilterProps: { debounceMs: 300 },
                                },
                            }}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 5 } },
                            }}
                            pageSizeOptions={[5, 10]}
                        />
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition font-poppins"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
