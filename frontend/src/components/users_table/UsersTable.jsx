import { useMemo, useState, useEffect, useCallback } from "react";
import { GridActionsCellItem, GridRowModes } from "@mui/x-data-grid";
import { useMediaQuery } from "@mui/material";
import { FiCheck, FiEdit, FiTrash2, FiX } from "react-icons/fi";
import { useRowEditing } from "../../hooks/useRowEditing";
import { useEntityFilters } from "../../hooks/useEntityFilters";
import { useColumnPopover } from "../../hooks/useColumnPopover";
import { BaseDataGrid } from "../common/BaseDataGrid";
import CustomFilterHeader from "./CustomFilterHeader";

const STATUS_OPTIONS = ["Ativo", "Inativo"];
const ROLE_OPTIONS = ["gestor", "comprador"];

const FILTER_CONFIG = {
  name: {
    shouldApply: (value = "") => value.trim().length > 0,
    predicate: (row, value) => row.name?.toLowerCase().includes(value.toLowerCase()),
  },
  email: {
    shouldApply: (value = "") => value.trim().length > 0,
    predicate: (row, value) => row.email?.toLowerCase().includes(value.toLowerCase()),
  },
  role: {
    shouldApply: (value) => Boolean(value),
    predicate: (row, value) => row.role === value,
  },
  supplier: {
    shouldApply: (value) => Boolean(value),
    predicate: (row, value) => {
        const rowVal = row.supplier;
        if (Array.isArray(rowVal)) return rowVal.some(s => s.includes(value));
        return rowVal === value;
    },
  },
  active: {
    shouldApply: (value) => Boolean(value),
    predicate: (row, value) => {
        const statusRow = row.is_active ? "Ativo" : "Inativo";
        return statusRow === value;
    },
  },
};

export default function UsersTable({ users = [] }) {
  const [rows, setRows] = useState([]);
  const isCompactLayout = useMediaQuery("(max-width:1279px)");
  
  const { rowModesModel, setRowModesModel, handleEditClick, handleSaveClick, handleCancelClick } = useRowEditing();
  const { anchorEl, activeColumnId, openPopover, closePopover } = useColumnPopover();
  const { filters, handleFilterChange, applyFilters } = useEntityFilters({ config: FILTER_CONFIG });

  useEffect(() => {
    // Mapeia os dados brutos do backend para o formato da tabela
    const normalizedUsers = users.map((user) => ({
      ...user,
      // Adiciona campo 'status' derivado de 'is_active' para facilitar o filtro visual
      status: user.is_active ? "Ativo" : "Inativo"
    }));
    setRows(normalizedUsers);
  }, [users]);

  // Opções dinâmicas para o filtro de Fornecedor
  const supplierOptions = useMemo(() => {
    const allSuppliers = rows.flatMap(r => r.supplier || []);
    return Array.from(new Set(allSuppliers.filter(Boolean)));
  }, [rows]);

  const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);

  const processRowUpdate = useCallback((newRow) => newRow, []);
  const handleDeleteClick = useCallback((id) => () => { 
      console.log("Solicitado delete para ID:", id); 
  }, []);

  const columns = useMemo(
    () => [
      {
        field: "name",
        headerName: "Analista de compras",
        minWidth: isCompactLayout ? 160 : 200,
        flex: 1,
        editable: true,
        renderHeader: () => (
          <CustomFilterHeader
            columnId="name"
            label="Analista de compras"
            activeColumnId={activeColumnId}
            anchorEl={anchorEl}
            onOpen={openPopover}
            onClose={closePopover}
            filterType="text"
            placeholder="Digite um nome"
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        ),
      },
      {
        field: "email",
        headerName: "Email",
        minWidth: isCompactLayout ? 200 : 250,
        flex: 1.2,
        editable: true,
        renderHeader: () => (
          <CustomFilterHeader
            columnId="email"
            label="Email"
            activeColumnId={activeColumnId}
            anchorEl={anchorEl}
            onOpen={openPopover}
            onClose={closePopover}
            filterType="text"
            placeholder="Buscar por email"
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        ),
      },
      // --- COLUNA PERFIL ---
      {
        field: "role",
        headerName: "Perfil",
        minWidth: 100,
        flex: 0.5,
        editable: true,
        type: "singleSelect",
        valueOptions: ROLE_OPTIONS,
        renderHeader: () => (
          <CustomFilterHeader
            columnId="role"
            label="Perfil"
            activeColumnId={activeColumnId}
            anchorEl={anchorEl}
            onOpen={openPopover}
            onClose={closePopover}
            filterType="select"
            placeholder="Perfil"
            options={ROLE_OPTIONS}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        ),
      },
      {
        field: "supplier",
        headerName: "Fornecedor",
        minWidth: isCompactLayout ? 120 : 150,
        flex: 0.7,
        editable: true,
        valueGetter: (value, row) => {
             if (Array.isArray(row.supplier)) return row.supplier.join(", ");
             return row.supplier || "";
        },
        renderHeader: () => (
          <CustomFilterHeader
            columnId="supplier"
            label="Fornecedor"
            activeColumnId={activeColumnId}
            anchorEl={anchorEl}
            onOpen={openPopover}
            onClose={closePopover}
            filterType="select"
            placeholder="Selecione"
            options={supplierOptions}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        ),
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: isCompactLayout ? 110 : 120,
        flex: 0.5,
        editable: true,
        type: "singleSelect",
        valueOptions: STATUS_OPTIONS,
        renderHeader: () => (
          <CustomFilterHeader
            columnId="active"
            label="Status"
            activeColumnId={activeColumnId}
            anchorEl={anchorEl}
            onOpen={openPopover}
            onClose={closePopover}
            filterType="select"
            placeholder="Status"
            options={STATUS_OPTIONS}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        ),
      },
      {
        field: "actions",
        type: "actions",
        headerName: "Ações",
        width: isCompactLayout ? 96 : 120,
        getActions: ({ id }) => {
            const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
            if (isInEditMode) {
                return [
                    <GridActionsCellItem icon={<FiCheck />} label="Salvar" onClick={handleSaveClick(id)} />,
                    <GridActionsCellItem icon={<FiX />} label="Cancelar" onClick={handleCancelClick(id)} color="inherit" />,
                ];
            }
            return [
                <GridActionsCellItem icon={<FiEdit />} label="Editar" onClick={handleEditClick(id)} color="inherit" />,
                <GridActionsCellItem icon={<FiTrash2 />} label="Excluir" onClick={handleDeleteClick(id)} color="inherit" />,
            ];
        },
      },
    ],
    [anchorEl, activeColumnId, filters, handleFilterChange, supplierOptions, isCompactLayout, rowModesModel]
  );

return (
    <BaseDataGrid
      rows={filteredRows}
      columns={columns}
      
      // --- A CORREÇÃO É ESTA LINHA ABAIXO ---
      // Ensina o DataGrid a usar 'user_id' em vez de procurar por 'id'
      getRowId={(row) => row.user_id} 
      
      editMode="row"
      rowModesModel={rowModesModel}
      onRowModesModelChange={setRowModesModel}
      processRowUpdate={processRowUpdate}
    />
  );
}