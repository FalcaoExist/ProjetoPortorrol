import React, { useState, useMemo, useCallback } from "react";
import { GridActionsCellItem, GridRowModes } from "@mui/x-data-grid";
import { Box, useMediaQuery } from "@mui/material";
import { FiCheck, FiX, FiEdit, FiTrash2, FiClock } from "react-icons/fi";
import { useRowEditing } from "../../hooks/useRowEditing";
import { useSuppliersTableLogic } from "../../hooks/useSuppliersTableLogic";
import { BaseDataGrid } from "../common/BaseDataGrid";
import AddSupplierModal from "./AddSupplierModal";
import LeadtimeHistoryModal from "./LeadtimeHistoryModal";
import { logger } from "../../utils/logger";

export default function SuppliersTable({
    rows = [],
    setRows,
    onRequestDelete,
    loading = false
}) {

    const isCompactLayout = useMediaQuery("(max-width:1279px)");

    const {
        rowModesModel,
        setRowModesModel,
        handleEditClick,
        handleSaveClick,
        handleCancelClick: genericHandleCancelClick,
    } = useRowEditing();

    const {
        openModal,
        leadtimeModalOpen,
        selectedSupplier,
        handleAdd,
        handleCloseModal,
        handleSave,
        handleDeleteClick,
        handleCancelClick,
        handleLeadtimeClick,
        handleCloseLeadtimeModal,
        processRowUpdate,
        handleSupplierUpdated,
    } = useSuppliersTableLogic({
        rows,
        setRows,
        onRequestDelete,
    });

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
                            onClick={handleCancelClick(id, genericHandleCancelClick)}
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
                onUpdateSupplier={handleSupplierUpdated}
            />
        </Box>
    );
}