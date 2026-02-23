import React, { useState, useMemo, useCallback } from "react";
import { GridActionsCellItem, GridRowModes } from "@mui/x-data-grid";
import { Box, useMediaQuery } from "@mui/material";
import { FiCheck, FiX, FiEdit, FiTrash2, FiClock } from "react-icons/fi";
import { useRowEditing } from "../../hooks/useRowEditing";
import { BaseDataGrid } from "../common/BaseDataGrid";
import AddSupplierModal from "./AddSupplierModal";
import LeadtimeHistoryModal from "./LeadtimeHistoryModal";

export default function SuppliersTable({ rows = [], setRows, onRequestDelete, historyBySupplier = {}, onRegisterCurrentSnapshot = () => ({}) }) {
    const isCompactLayout = useMediaQuery("(max-width:1279px)");
    const [openModal, setOpenModal] = useState(false);
    const [leadtimeModalOpen, setLeadtimeModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const {
        rowModesModel,
        setRowModesModel,
        handleEditClick,
        handleSaveClick,
        handleCancelClick: genericHandleCancelClick, // Rename to avoid conflict
    } = useRowEditing();

    const handleAdd = useCallback(() => {
        setOpenModal(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setOpenModal(false);
    }, []);

    const handleSave = useCallback((newSupplier) => {
        if (!setRows) return;

        setRows((prevRows) => {
            // TODO: remover geração local de ID quando o backend retornar o identificador oficial.
            const newId = prevRows.length ? Math.max(...prevRows.map((row) => row.id)) + 1 : 1;
            const normalizedRow = {
                id: newId,
                name: newSupplier.name,
                start: newSupplier.start ? new Date(newSupplier.start) : null,
                end: newSupplier.end ? new Date(newSupplier.end) : null,
                budget: newSupplier.budget ? Number(newSupplier.budget) : 0,
            };
            return [...prevRows, normalizedRow];
        });

        setOpenModal(false);
    }, [setRows]);

    const handleDeleteClick = useCallback((id) => () => {
        if (!onRequestDelete) return;
        const targetRow = rows.find((row) => row.id === id);
        if (targetRow) {
            onRequestDelete(targetRow);
        }
    }, [rows, onRequestDelete]);

    const handleCancelClick = useCallback((id) => () => {
        genericHandleCancelClick(id)(); // Call the hook's cancel handler
        if (!setRows) return;
        const editedRow = rows.find((row) => row.id === id);
        if (editedRow?.isNew) {
            setRows((prevRows) => prevRows.filter((row) => row.id !== id));
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
    
    const processRowUpdate = useCallback((newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        if (!setRows) {
            return updatedRow;
        }
        setRows((prevRows) => prevRows.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    }, [setRows]);

    const columns = useMemo(() => [
        {
            field: "name",
            headerName: "Fornecedor",
            minWidth: isCompactLayout ? 130 : 160,
            flex: 1,
            editable: true,
            isCellEditable: (params) => params.row.isNew,
            headerAlign: "left",
            align: "left",
        },
        {
            field: "start",
            headerName: "Início",
            type: "date",
            minWidth: isCompactLayout ? 130 : 150,
            flex: 0.8,
            editable: true,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString("pt-BR") : '',
            headerAlign: "left",
            align: "left",
        },
        {
            field: "end",
            headerName: "Fim",
            type: "date",
            minWidth: isCompactLayout ? 130 : 150,
            flex: 0.8,
            editable: true,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString("pt-BR") : '',
            headerAlign: "left",
            align: "left",
        },
        {
            field: "budget",
            headerName: "Orçamento (R$)",
            type: "number",
            minWidth: isCompactLayout ? 150 : 200,
            flex: 1,
            editable: true,
            valueFormatter: (value) => value ? value.toLocaleString("pt-BR", { style: 'currency', currency: 'BRL' }) : '',
            headerAlign: "left",
            align: "left",
        },
        {
            field: "actions",
            type: "actions",
            headerName: "Ações",
            width: isCompactLayout ? 120 : 140,
            cellClassName: "actions",
            headerAlign: "center",
            align: "center",
            justify:"center",
            getActions: ({ id }) => {
                const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

                if (isInEditMode) {
                    return [
                        <GridActionsCellItem icon={<FiCheck />} label="Salvar" onClick={handleSaveClick(id)} color="primary" />,
                        <GridActionsCellItem icon={<FiX />} label="Cancelar" onClick={handleCancelClick(id)} color="inherit" />,
                    ];
                }

                return [
                    <GridActionsCellItem icon={<FiClock />} label="Leadtime" onClick={handleLeadtimeClick(id)} color="inherit" />,
                    <GridActionsCellItem icon={<FiEdit />} label="Editar" onClick={handleEditClick(id)} color="inherit" />,
                    <GridActionsCellItem icon={<FiTrash2 />} label="Excluir" onClick={handleDeleteClick(id)} color="inherit" />,
                ];
            },
        },
    ], [rowModesModel, rows, handleEditClick, handleSaveClick, handleDeleteClick, handleCancelClick, handleLeadtimeClick, isCompactLayout]);

    const selectedHistory = selectedSupplier ? historyBySupplier[selectedSupplier.id] || [] : [];

    return (
        <Box sx={{ width: '100%' }}>
            <BaseDataGrid
                rows={rows}
                columns={columns}
                editMode="row"
                rowModesModel={rowModesModel}
                onRowModesModelChange={setRowModesModel}
                processRowUpdate={processRowUpdate}
                headerStyle="alternative" // Use the alternative header style
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
            />
        </Box>
    );
}