import React, { useState, useMemo, useCallback } from "react";
import { GridActionsCellItem, GridRowModes } from "@mui/x-data-grid";
import { Box, useMediaQuery } from "@mui/material";
import { FiCheck, FiX, FiEdit, FiTrash2, FiClock } from "react-icons/fi";
import { useRowEditing } from "../../hooks/useRowEditing";
import { BaseDataGrid } from "../common/BaseDataGrid";
import AddSupplierModal from "./AddSupplierModal";
import LeadtimeHistoryModal from "./LeadtimeHistoryModal";
import { logger } from "../../utils/logger";

import {
    updateSupplier,
    createSupplier
} from "../../services/supplierService";

const parseDateForGrid = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00`);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateOnlyString = (value) => {
    if (!value) return null;
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().slice(0, 10);
};

export default function SuppliersTable({
    rows = [],
    setRows,
    onRequestDelete,
    onRegisterCurrentSnapshot = () => ({}),
    loading = false
}) {

    const isCompactLayout = useMediaQuery("(max-width:1279px)");

    const [openModal, setOpenModal] = useState(false);
    const [leadtimeModalOpen, setLeadtimeModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const {
        rowModesModel,
        setRowModesModel,
        handleEditClick,
        handleSaveClick,
        handleCancelClick: genericHandleCancelClick,
    } = useRowEditing();

    const handleAdd = useCallback(() => {
        setOpenModal(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setOpenModal(false);
    }, []);

    const handleSave = useCallback(async (newSupplier) => {
        try {

            const payload = {
                name: newSupplier.name,
                is_active: true,
                budget: Number(newSupplier.budget),
                start: newSupplier.start,
                end: newSupplier.end,
                leadtimes: []
            };

            const created = await createSupplier(payload);

            const normalizedRow = {
                id: created.supplier_id,
                name: created.name,
                start: parseDateForGrid(created.start),
                end: parseDateForGrid(created.end),
                budget: created.budget ?? 0,
                leadtimes: created.leadtimes || [],
            };

            setRows((prev) => [...prev, normalizedRow]);

            setOpenModal(false);

        } catch (error) {
            logger.error("Erro ao criar fornecedor:", error);
        }
    }, [setRows, rows]);

    const handleDeleteClick = useCallback((id) => () => {
        if (!onRequestDelete) return;
        const targetRow = rows.find((row) => row.id === id);
        if (targetRow) {
            onRequestDelete(targetRow);
        }
    }, [rows, onRequestDelete]);

    const handleCancelClick = useCallback((id) => () => {
        genericHandleCancelClick(id)();
        if (!setRows) return;
        const editedRow = rows.find((row) => row.id === id);
        if (editedRow?.isNew) {
            setRows((prevRows) =>
                prevRows.filter((row) => row.id !== id)
            );
        }
    }, [genericHandleCancelClick, rows, setRows]);

    const handleLeadtimeClick = useCallback((id) => () => {
        const targetRow = rows.find((row) => row.id === id);
        setSelectedSupplier(targetRow || null);
        setLeadtimeModalOpen(true);
    }, [rows]);

    const handleCloseLeadtimeModal = useCallback(() => {
        setLeadtimeModalOpen(false);
        setSelectedSupplier(null);
    }, []);

    const processRowUpdate = useCallback(async (newRow) => {
        try {

            const originalRow = rows.find(r => r.id === newRow.id) || {};

            const rawLeadtimes = (newRow.leadtimes && newRow.leadtimes.length) ? newRow.leadtimes : (originalRow.leadtimes || []);

            const normalizedLeadtimes = (rawLeadtimes || []).map((lt) => ({
                branch_id: lt.branch_id || lt.branchId || lt.id,
                leadtime: lt.leadtime != null ? lt.leadtime : (lt.days != null ? lt.days : 0),
            }));

            const startDate = toDateOnlyString(newRow.start);
            const endDate = toDateOnlyString(newRow.end);

            if (startDate && endDate && startDate > endDate) {
                throw new Error("Data de término deve ser igual ou posterior à data de início.");
            }



            const payload = {
                name: newRow.name,
                budget: Number(newRow.budget),
                start: startDate,
                end: endDate,
                leadtimes: normalizedLeadtimes,
            };
            const updated = await updateSupplier(newRow.id, payload);

            const updatedRow = {
                id: updated.supplier_id,
                name: updated.name,
                start: parseDateForGrid(updated.start),
                end: parseDateForGrid(updated.end),
                budget: updated.budget,
                leadtimes: updated.leadtimes || []
            };

            setRows((prev) =>
                prev.map((row) =>
                    row.id === updatedRow.id ? updatedRow : row
                )
            );

            return updatedRow;

        } catch (error) {
            logger.error("Erro ao atualizar fornecedor:", error);
            throw error;
        }

    }, [setRows, rows]);

    const columns = useMemo(() => [
        {
            field: "name",
            headerName: "Fornecedor",
            minWidth: isCompactLayout ? 130 : 160,
            flex: 1,
            editable: true,
            align:"left",
            headerAlign: "left",
        },
       
        {
            field: "budget",
            headerName: "Orçamento (R$)",
            type: "number",
            align:"left",
            headerAlign: "left", 
            minWidth: isCompactLayout ? 150 : 200,
            flex: 1,
            editable: true,
            valueFormatter: (value) =>
                value
                    ? value.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                      })
                    : "",
        },
         {
            field: "start",
            headerName: "Início",
            type: "date",
            minWidth: isCompactLayout ? 130 : 150,
            flex: 0.8,
            editable: true,
            align:"left",
            headerAlign: "left",
            valueFormatter: (value) =>
                value ? new Date(value).toLocaleDateString("pt-BR") : '',
        },
        {
            field: "end",
            headerName: "Fim",
            type: "date",
            minWidth: isCompactLayout ? 130 : 150,
            flex: 0.8,
            align:"left",
            headerAlign: "left", 
            editable: true,
            valueFormatter: (value) =>
                value ? new Date(value).toLocaleDateString("pt-BR") : '',
        },
        {
            field: "actions",
            type: "actions",
            headerName: "Ações",
            align:"left",
            headerAlign: "left", 
            width: isCompactLayout ? 120 : 140,
            getActions: ({ id }) => {
                const isInEditMode =
                    rowModesModel[id]?.mode === GridRowModes.Edit;

                if (isInEditMode) {
                    return [
                        <GridActionsCellItem
                            icon={<FiCheck />}
                            label="Salvar"
                            onClick={handleSaveClick(id)}
                            color="primary"
                        />,
                        <GridActionsCellItem
                            icon={<FiX />}
                            label="Cancelar"
                            onClick={handleCancelClick(id)}
                            color="inherit"
                        />,
                    ];
                }

                return [
                    <GridActionsCellItem
                        icon={<FiClock />}
                        label="Leadtime"
                        onClick={handleLeadtimeClick(id)}
                        color="inherit"
                    />,
                    <GridActionsCellItem
                        icon={<FiEdit />}
                        label="Editar"
                        onClick={handleEditClick(id)}
                        color="inherit"
                    />,
                    <GridActionsCellItem
                        icon={<FiTrash2 />}
                        label="Excluir"
                        onClick={handleDeleteClick(id)}
                        color="inherit"
                    />,
                ];
            },
        },
    ], [
        rowModesModel,
        handleEditClick,
        handleSaveClick,
        handleDeleteClick,
        handleCancelClick,
        handleLeadtimeClick,
        isCompactLayout,
    ]);

    const selectedHistory = selectedSupplier?.history || [];

    return (
        <Box sx={{ width: "100%" }}>
            <BaseDataGrid
                rows={rows}
                columns={columns}
                loading={loading}
                editMode="row"
                rowModesModel={rowModesModel}
                onRowModesModelChange={setRowModesModel}
                processRowUpdate={processRowUpdate}
                onProcessRowUpdateError={(error) => logger.error("Erro ao atualizar linha de fornecedor:", error)}
                headerStyle="alternative"
            />

            <button
                onClick={handleAdd}
                className="bg-[#f43629] hover:bg-white text-white hover:text-black shadow-lg font-poppins uppercase text-sm p-2 rounded-md mt-6"
            >
                Adicionar Fornecedor
            </button>

            <AddSupplierModal
                isOpen={openModal}
                onClose={handleCloseModal}
                onSave={handleSave}
            />

            <LeadtimeHistoryModal
                isOpen={leadtimeModalOpen}
                onClose={handleCloseLeadtimeModal}
                supplier={selectedSupplier}
                history={selectedHistory}
                onRegisterCurrentSnapshot={onRegisterCurrentSnapshot}
                onUpdateSupplier={(updated) => {
                    if (!updated) return;
                    const updatedRow = {
                        id: updated.supplier_id,
                        name: updated.name,
                        start: parseDateForGrid(updated.start),
                        end: parseDateForGrid(updated.end),
                        budget: updated.budget,
                        leadtimes: updated.leadtimes || [],
                    };
                    setRows((prev) => prev.map(r => r.id === updatedRow.id ? updatedRow : r));
                }}
            />
        </Box>
    );
}