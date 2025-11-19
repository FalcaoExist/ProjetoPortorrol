import { useMemo, useState, useEffect, useCallback } from "react";
import { GridActionsCellItem, GridRowModes } from "@mui/x-data-grid";
import { FiCheck, FiEdit, FiTrash2, FiX } from "react-icons/fi";
import { useRowEditing } from "../../hooks/useRowEditing";
import { useEntityFilters } from "../../hooks/useEntityFilters";
import { useColumnPopover } from "../../hooks/useColumnPopover";
import { BaseDataGrid } from "../common/BaseDataGrid";
import CustomFilterHeader from "./CustomFilterHeader";

// Lista de status suportados pelo seletor de status da tabela
const STATUS_OPTIONS = ["Ativo", "Inativo"];

// Regras que definem como cada filtro deve ser aplicado sobre as linhas
const FILTER_CONFIG = {
  name: {
    shouldApply: (value = "") => value.trim().length > 0,
    predicate: (row, value) => row.name?.toLowerCase().includes(value.toLowerCase()),
  },
  email: {
    shouldApply: (value = "") => value.trim().length > 0,
    predicate: (row, value) => row.email?.toLowerCase().includes(value.toLowerCase()),
  },
  supplier: {
    shouldApply: (value) => Boolean(value),
    predicate: (row, value) => row.supplier === value,
  },
  active: {
    shouldApply: (value) => Boolean(value),
    predicate: (row, value) => row.active === value,
  },
};

export default function UsersTable({ users = [] }) {
  const [rows, setRows] = useState([]);
  // Edição, visualização, cancelamento
  const { rowModesModel, setRowModesModel, handleEditClick, handleSaveClick, handleCancelClick } = useRowEditing();
  // Abrir e fechar de filtro nas colunas
  const { anchorEl, activeColumnId, openPopover, closePopover } = useColumnPopover();
  // Gerenciar filtros aplicados à tabela
  const { filters, handleFilterChange, applyFilters } = useEntityFilters({ config: FILTER_CONFIG });

  useEffect(() => {
    // Normaliza os dados recebidos
    const normalizedUsers = users.map((user) => ({
      ...user,
      active: user.active ?? user.status ?? "Ativo",
    }));
    setRows(normalizedUsers);
  }, [users]);

  // Gera dinamicamente as opções únicas do campo fornecedor para o filtro/select
  const supplierOptions = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.supplier).filter(Boolean)));
  }, [rows]);

  // Aplica os filtros ativos sobre as linhas antes de exibir na grade
  const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);

  const handleDeleteClick = useCallback(
    (id) => () => {
      const rowToDelete = rows.find((row) => row.id === id);
      if (!rowToDelete) {
        return;
      }

      const confirmed = window.confirm(`Remover usuário "${rowToDelete.name}"?`);
      if (confirmed) {
        setRows((previousRows) => previousRows.filter((row) => row.id !== id));
      }
    },
    [rows]
  );

  // Atualiza a linha editada na coleção local após salvar
  const processRowUpdate = useCallback((newRow) => {
    setRows((previousRows) => previousRows.map((row) => (row.id === newRow.id ? newRow : row)));
    return newRow;
  }, []);

  const onProcessRowUpdateError = useCallback((error) => {
    console.error("Error updating row:", error);
  }, []);

  const columns = useMemo(
    () => [
      // Coluna com o nome do analista e filtro de texto
      {
        field: "name",
        headerName: "Analista de compras",
        minWidth: 200,
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
      // Coluna de email com filtragem por texto
      {
        field: "email",
        headerName: "Email",
        minWidth: 250,
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
      // Coluna de fornecedor com seletor de opções dinâmicas
      {
        field: "supplier",
        headerName: "Fornecedor",
        minWidth: 150,
        flex: 0.7,
        editable: true,
        type: "singleSelect",
        valueOptions: supplierOptions,
        renderHeader: () => (
          <CustomFilterHeader
            columnId="supplier"
            label="Fornecedor"
            activeColumnId={activeColumnId}
            anchorEl={anchorEl}
            onOpen={openPopover}
            onClose={closePopover}
            filterType="select"
            placeholder="Selecione o fornecedor"
            options={supplierOptions}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        ),
      },
      // Coluna de status com seletor baseado em STATUS_OPTIONS
      {
        field: "active",
        headerName: "Status",
        minWidth: 120,
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
            placeholder="Selecione o status"
            options={STATUS_OPTIONS}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        ),
      },
      // Coluna de ações que alterna entre botões de edição e confirmação
      {
        field: "actions",
        type: "actions",
        headerName: "Ações",
        width: 120,
        cellClassName: "actions",
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
    [
      anchorEl,
      activeColumnId,
      filters,
      handleFilterChange,
      handleEditClick,
      handleSaveClick,
      handleDeleteClick,
      handleCancelClick,
      openPopover,
      closePopover,
      rowModesModel,
      supplierOptions,
    ]
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
    />
  );
}