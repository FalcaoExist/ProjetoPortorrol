import React, { useMemo } from "react";
import { GridActionsCellItem, GridRowModes } from "@mui/x-data-grid";
import { Popover } from "@mui/material";
import { FiCheck, FiX, FiEdit, FiTrash2, FiLock } from "react-icons/fi";

// Imports organizados
import { BaseDataGrid } from "../common/BaseDataGrid";
import CustomFilterHeader from "./CustomFilterHeader";
import SupplierEditCell from "./SupplierEditCell";
// StatusCell removido, pois voltamos ao texto padrão
import { useUsersTableLogic } from "../../hooks/useUsersTableLogic";

// Função auxiliar para ordenar textos em Português
const ptBRComparator = (v1, v2) => {
  const s1 = v1?.toString() || "";
  const s2 = v2?.toString() || "";
  return s1.localeCompare(s2, 'pt-BR', { sensitivity: 'base' });
};

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL: UsersTable
// ---------------------------------------------------------------------------
export default function UsersTable({ users = [], onDelete, onUpdate, onChangePassword, availableSuppliers = [] }) {
  const {
    filteredRows,
    rowModesModel,
    setRowModesModel,
    popoverState,
    filters,
    supplierOptions,
    handleHeaderClick,
    handlePopoverClose,
    handleFilterChange,
    processRowUpdate,
    handleEditClick,
    handleSaveClick,
    handleCancelClick
  } = useUsersTableLogic({ users, availableSuppliers, onUpdate });

  const onProcessRowUpdateError = (error) => console.error("Erro ao atualizar linha:", error);

  // Definição das Colunas
  const columns = useMemo(
    () => [
      {
        field: "name", 
        headerName: "Analista de compras", 
        flex: 1.2, 
        minWidth: 200, 
        editable: true,
        sortComparator: ptBRComparator,
        renderHeader: () => (
          <CustomFilterHeader
            columnId="name" label="Analista de compras" activeColumnId={popoverState.columnId}
            anchorEl={popoverState.anchorEl} handleHeaderClick={handleHeaderClick}
            handleClose={handlePopoverClose} filterType="text" placeholder="Buscar nome"
            filters={filters} handleFilterChange={handleFilterChange}
          />
        ),
      },
      {
        field: "email", 
        headerName: "Email", 
        flex: 1.45, 
        minWidth: 250, 
        editable: true,
        sortComparator: ptBRComparator,
        renderHeader: () => (
          <CustomFilterHeader
            columnId="email" label="Email" activeColumnId={popoverState.columnId}
            anchorEl={popoverState.anchorEl} handleHeaderClick={handleHeaderClick}
            handleClose={handlePopoverClose} filterType="text" placeholder="Buscar email"
            filters={filters} handleFilterChange={handleFilterChange}
          />
        ),
      },
      {
        field: "supplier", 
        headerName: "Fornecedor", 
        flex: 1.55, 
        minWidth: 300, 
        editable: true,
        sortComparator: ptBRComparator,
        renderEditCell: (params) => (<SupplierEditCell {...params} options={supplierOptions} />),
        valueFormatter: (value) => Array.isArray(value) ? value.join(", ") : value,
        renderHeader: () => (
          <CustomFilterHeader
            columnId="supplier" label="Fornecedor" activeColumnId={popoverState.columnId}
            anchorEl={popoverState.anchorEl} handleHeaderClick={handleHeaderClick}
            handleClose={handlePopoverClose} filterType="multiSelect" placeholder="Filtrar fornecedor"
            options={supplierOptions} filters={filters} handleFilterChange={handleFilterChange}
          />
        ),
      },
      {
        field: "active", 
        headerName: "Status", 
        width: 120, 
        editable: true, 
        type: "singleSelect", 
        valueOptions: ["Ativo", "Inativo"],
        sortComparator: ptBRComparator,
        // [ALTERADO] Removido renderCell para voltar ao texto padrão (sem fundo/bordas)
        renderHeader: () => (
          <CustomFilterHeader
            columnId="active" label="Status" activeColumnId={popoverState.columnId}
            anchorEl={popoverState.anchorEl} handleHeaderClick={handleHeaderClick}
            handleClose={handlePopoverClose} filterType="select" placeholder="Status"
            options={["Ativo", "Inativo"]} filters={filters} handleFilterChange={handleFilterChange}
          />
        ),
      },
      {
        field: "actions", type: "actions", headerName: "Ações", width: 140, cellClassName: "actions",
        getActions: ({ id, row }) => {
          const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
          if (isInEditMode) {
            return [
              <GridActionsCellItem icon={<FiCheck />} label="Salvar" onClick={handleSaveClick(id)} />,
              <GridActionsCellItem icon={<FiX />} label="Cancelar" onClick={handleCancelClick(id)} color="inherit" />,
            ];
          }
          const isProtectedGestor = row.email === "dionatas.terres@portorrol.com";
          return [
            <GridActionsCellItem icon={<FiEdit />} label="Editar" onClick={handleEditClick(id)} color="inherit" />,
            <GridActionsCellItem icon={<FiLock />} label="Alterar Senha" onClick={() => onChangePassword(id, row.name)} color="inherit" />,
            <GridActionsCellItem 
                icon={<FiTrash2 style={isProtectedGestor ? { opacity: 0.5, cursor: "not-allowed" } : {}} />} 
                label="Excluir" 
                onClick={() => {
                   if (isProtectedGestor) alert("Impossível excluir o gestor!");
                   else onDelete(id);
                }} 
                color={isProtectedGestor ? "default" : "inherit"} 
            />,
          ];
        },
      },
    ],
    [rowModesModel, filters, popoverState, supplierOptions, handleFilterChange, handleHeaderClick, handlePopoverClose, handleEditClick, handleSaveClick, onDelete, handleCancelClick, onChangePassword]
  );

  return (
    <BaseDataGrid
      rows={filteredRows}
      columns={columns}
      editMode="row"
      rowModesModel={rowModesModel}
      onRowModesModelChange={setRowModesModel}
      processRowUpdate={processRowUpdate}
      onProcessRowUpdateError={onProcessRowUpdateError}
      sortingOrder={['asc', 'desc']} 
      sx={{ "& .MuiDataGrid-row--editing .MuiDataGrid-cell": { paddingTop: "2px", paddingBottom: "2px" } }}
    />
  );
}