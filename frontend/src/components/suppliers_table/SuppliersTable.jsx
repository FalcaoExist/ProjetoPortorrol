import React, { useMemo, useCallback } from "react";
import { GridActionsCellItem, GridRowModes } from "@mui/x-data-grid";
import { Box, useMediaQuery } from "@mui/material";
import { FiCheck, FiX, FiEdit, FiTrash2 } from "react-icons/fi";
import { useRowEditing } from "../../hooks/useRowEditing";
import { BaseDataGrid } from "../common/BaseDataGrid";

export default function SuppliersTable({ rows = [], setRows, onRequestDelete }) {
    const isCompactLayout = useMediaQuery("(max-width:1279px)");
    
    // Using the custom hook for editing logic
    const {
        rowModesModel,
        setRowModesModel,
        handleEditClick,
        handleSaveClick,
        handleCancelClick: genericHandleCancelClick, // Rename to avoid conflict
        setEditMode,
    } = useRowEditing();

    const handleAdd = useCallback(() => {
        if (!setRows) return;
        // Remover geração local de ID quando o backend retornar o identificador oficial.
        const id = rows.length ? Math.max(...rows.map((row) => row.id)) + 1 : 1;
        setRows((prevRows) => [
            ...prevRows,
            { id, name: "", start: new Date(), end: new Date(), budget: 0, leadtime: 0, isNew: true },
        ]);
        setEditMode(id);
    }, [rows, setRows, setEditMode]);

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
    
    const processRowUpdate = (newRow) => {
        const updatedRow = { ...newRow, isNew: false };
        if (!setRows) {
            return updatedRow;
        }
        setRows((prevRows) => prevRows.map((row) => (row.id === newRow.id ? updatedRow : row)));
        return updatedRow;
    };

    const columns = useMemo(() => [
        {
            field: "name",
            headerName: "Fornecedor",
            minWidth: isCompactLayout ? 130 : 160,
            flex: 1,
            editable: true,
            isCellEditable: (params) => params.row.isNew,
            headerAlign: "center",
            align: "center",
            justify:"center",
        },
        {
            field: "start",
            headerName: "Início",
            type: "date",
            minWidth: isCompactLayout ? 130 : 150,
            flex: 0.8,
            editable: true,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString("pt-BR") : '',
            headerAlign: "center",
            align: "center",
            justify:"center",
        },
        {
            field: "end",
            headerName: "Fim",
            type: "date",
            minWidth: isCompactLayout ? 130 : 150,
            flex: 0.8,
            editable: true,
            valueFormatter: (value) => value ? new Date(value).toLocaleDateString("pt-BR") : '',
            headerAlign: "center",
            align: "center",
            justify:"center",
        },
        {
            field: "budget",
            headerName: "Orçamento (R$)",
            type: "number",
            minWidth: isCompactLayout ? 150 : 200,
            flex: 1,
            editable: true,
            valueFormatter: (value) => value ? value.toLocaleString("pt-BR", { style: 'currency', currency: 'BRL' }) : '',
            headerAlign: "center",
            align: "center",
            justify:"center",
        },
        {
            field: "leadtime",
            headerName: "Leadtime",
            type: "number",
            minWidth: isCompactLayout ? 110 : 140,
            flex: 0.6,
            editable: true,
            valueFormatter: (value) => (value != null ? `${value} dias` : ''),
            headerAlign: "center",
            align: "center",
            justify:"center",
        },
        {
            field: "actions",
            type: "actions",
            headerName: "Ações",
            width: isCompactLayout ? 92 : 110,
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
                    <GridActionsCellItem icon={<FiEdit />} label="Editar" onClick={handleEditClick(id)} color="inherit" />,
                    <GridActionsCellItem icon={<FiTrash2 />} label="Excluir" onClick={handleDeleteClick(id)} color="inherit" />,
                ];
            },
        },
    ], [rowModesModel, rows, handleEditClick, handleSaveClick, handleDeleteClick, handleCancelClick, isCompactLayout]);

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
                className="bg-[#5A44B0] hover:bg-white text-white hover:text-black shadow-lg font-poppins uppercase text-sm p-2 rounded-md mt-6"
            >
                Adicionar Fornecedor
            </button>
        </Box>
    );
}