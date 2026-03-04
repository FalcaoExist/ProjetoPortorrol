import React, { useMemo, useState, useEffect } from "react";
import { FiClock, FiX, FiEdit2, FiCheck } from "react-icons/fi";
import { GridToolbarQuickFilter } from "@mui/x-data-grid";
import { BaseDataGrid } from "../common/BaseDataGrid";
import { getSupplierHistory, updateSupplier, getSupplierById } from "../../services/supplierService";
import dashboardService from "../../services/dashboardService";


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
    onUpdateSupplier = () => {},
    columnsConfig = historyColumns,
}) {

    const [branchLeadtimes, setBranchLeadtimes] = useState([]);
    const [editingBranchId, setEditingBranchId] = useState(null);
    const [tempLeadtime, setTempLeadtime] = useState("");
    const [historyRows, setHistoryRows] = useState([]);

    const fetchHistory = async (supplierId) => {
        if (!supplierId) return;

        try {
            const data = await getSupplierHistory(supplierId);

            const normalized = (data || []).map((item) => ({
                ...item,
                recordedAt: item.created_at,
                id: item.history_id,
            }));

            setHistoryRows(normalized);

        } catch (error) {
            console.error("Erro ao buscar histórico:", error);
        }
    };

    useEffect(() => {
        if (!supplier || !isOpen) return;

        (async () => {
            try {
                const [filiais, freshSupplier] = await Promise.all([dashboardService.getFiliais(), getSupplierById(supplier.id)]);
                const supplierLeadtimes = (freshSupplier && (freshSupplier.leadtimes || [])) || [];
                const ltMap = new Map((supplierLeadtimes || []).map(lt => [lt.branch_id, lt.leadtime]));

                const mapped = (filiais || []).map((branch) => ({
                    id: branch.id,
                    branch_id: branch.id,
                    name: branch.nome || branch.name || branch.id,
                    days: ltMap.has(branch.id) ? ltMap.get(branch.id) : 0,
                }));

                setBranchLeadtimes(mapped);

                await fetchHistory(freshSupplier.supplier_id || freshSupplier.id || supplier.id);

            } catch (error) {
                console.error("Erro ao inicializar modal de leadtimes:", error);
            }
        })();

    }, [supplier, isOpen]);

    // Clear internal state when modal is closed to avoid leaking previous supplier data
    useEffect(() => {
        if (isOpen) return;
        setBranchLeadtimes([]);
        setHistoryRows([]);
        setEditingBranchId(null);
        setTempLeadtime("");
    }, [isOpen]);

    const handleEdit = (branch) => {
        setEditingBranchId(branch.id);
        setTempLeadtime(branch.days);
    };

    const handleSave = async (branchId) => {

        const updatedLeadtimes = branchLeadtimes.map(b =>
            b.id === branchId
                ? { ...b, days: Number(tempLeadtime) }
                : b
        );

        try {

            const payload = {
                name: supplier.name,
                budget: supplier.budget,
                start: supplier.start
                    ? new Date(supplier.start).toISOString().split("T")[0]
                    : null,
                end: supplier.end
                    ? new Date(supplier.end).toISOString().split("T")[0]
                    : null,
                leadtimes: updatedLeadtimes.map(b => ({
                    branch_id: b.branch_id,
                    leadtime: b.days,
                })),
            };

            

            const resp = await updateSupplier(supplier.id, payload);
            

            // notify parent to sync rows
            try {
                onUpdateSupplier(resp);
            } catch (e) {
                console.warn("onUpdateSupplier callback failed:", e);
            }
            setBranchLeadtimes(updatedLeadtimes);
            await fetchHistory(supplier.id);
            setEditingBranchId(null);
            setTempLeadtime("");

        } catch (error) {
            console.error("Erro ao atualizar leadtime:", error, error?.data || error?.message || error?.toString());
        }
    };

    const rows = useMemo(() => historyRows, [historyRows]);
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