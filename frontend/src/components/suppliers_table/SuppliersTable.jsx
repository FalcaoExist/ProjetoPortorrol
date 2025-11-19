import React, { useState, useMemo, useCallback } from "react";
import { GridActionsCellItem, GridRowModes } from "@mui/x-data-grid";
import { Box } from "@mui/material";
import { FiCheck, FiX, FiEdit, FiTrash2 } from "react-icons/fi";
import { useRowEditing } from "../../hooks/useRowEditing";
import { BaseDataGrid } from "../common/BaseDataGrid";

const initialRows = [
    { id: 1, name: "Timken", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 60000, leadtime: 15 },
    { id: 2, name: "NSK", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 30000, leadtime: 9 },
    { id: 3, name: "FRM", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 30000, leadtime: 9 },
    { id: 4, name: "BGL", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 10000, leadtime: 7 },
    { id: 5, name: "IKO", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 45000, leadtime: 20 },
    { id: 6, name: "SAV", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 45000, leadtime: 20 },
];

export default function SuppliersTable() {
    const [rows, setRows] = useState(initialRows);
    const [nextId, setNextId] = useState(Math.max(...initialRows.map(r => r.id)) + 1);
    
    // Using the custom hook for editing logic
    const {
        rowModesModel,
        setRowModesModel,
        handleEditClick,
        handleSaveClick,
        handleCancelClick: genericHandleCancelClick, // Rename to avoid conflict
        setEditMode,
    } = useRowEditing();

    const handleAdd = () => {
        const id = nextId;
        setNextId(prev => prev + 1);
        setRows((oldRows) => [
            ...oldRows,
            { id, name: "", start: new Date(), end: new Date(), budget: 0, leadtime: 0, isNew: true },
        ]);
        setEditMode(id); // Use the hook's function to set the new row to edit mode
    };

    const handleDeleteClick = (id) => () => {
        // Confirmation logic stays within the component
        setRows(rows.filter((row) => row.id !== id));
    };

    const handleCancelClick = (id) => () => {
        genericHandleCancelClick(id)(); // Call the hook's cancel handler
        const editedRow = rows.find((row) => row.id === id);
        if (editedRow?.isNew) {
            setRows(rows.filter((row) => row.id !== id));
        }
    };
    
    const processRowUpdate = (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

    const columns = useMemo(() => [
        {
            field: "name",
            headerName: "Fornecedor",
            width: 180,
            editable: true,
            isCellEditable: (params) => params.row.isNew,
        },
        {
            field: "start",
            headerName: "Início",
            type: "date",
            width: 150,
            editable: true,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString("pt-BR") : '',
        },
        {
            field: "end",
            headerName: "Fim",
            type: "date",
            width: 150,
            editable: true,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString("pt-BR") : '',
        },
        {
            field: "budget",
            headerName: "Orçamento (R$)",
            type: "number",
            width: 180,
            editable: true,
            valueFormatter: (value) => value ? value.toLocaleString("pt-BR", { style: 'currency', currency: 'BRL' }) : '',
        },
        {
            field: "leadtime",
            headerName: "Leadtime",
            type: "number",
            width: 120,
            editable: true,
            valueFormatter: (value) => (value != null ? `${value} dias` : ''),
        },
        {
            field: "actions",
            type: "actions",
            headerName: "Ações",
            width: 100,
            cellClassName: "actions",
            getActions: ({ id }) => {
                const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

                if (isInEditMode) {
                    return [
                        <GridActionsCellItem icon={<FiCheck />} label="Salvar" onClick={handleSaveClick(id)} color="primary" />,
                        <GridActionsCellItem icon={<FiX />} label="Cancelar" onClick={handleCancelClick(id)} color="inherit" />,
                    ];
                }

                return [
                    <GridActionsCellItem icon={<FiEdit />} label="Editar" onClick={handleEditClick(id)} color="inherit" />,
                    <GridActionsCellItem icon={<FiTrash2 />} label="Excluir" onClick={handleDeleteClick(id)} color="inherit" />,
                ];
            },
        },
    ], [rowModesModel, rows, handleEditClick, handleSaveClick, handleDeleteClick, handleCancelClick]);

    return (
        <Box sx={{ width: '100%', mt: 2 }}>
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
                className="bg-[#5A44B0] hover:bg-white text-white hover:text-black shadow-lg font-poppins uppercase text-sm p-2 rounded-md mt-6"
            >
                Adicionar Fornecedor
            </button>
        </Box>
    );
}