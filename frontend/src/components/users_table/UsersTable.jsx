import React, { useMemo, useState, useEffect, useCallback } from "react";
import { GridActionsCellItem, GridRowModes } from "@mui/x-data-grid";
import { Box, Popover } from "@mui/material";
import { FiX, FiChevronDown, FiCheck, FiEdit, FiTrash2 } from "react-icons/fi";
import FilterPopoverContent from "./FilterPopoverContent";
import { useRowEditing } from "../../hooks/useRowEditing";
import { BaseDataGrid } from "../common/BaseDataGrid";

// CustomFilterHeader component remains the same as it's specific to this table
const CustomFilterHeader = React.memo(({
  columnId,
  label,
  activeColumnId,
  anchorEl,
  handleHeaderClick,
  handleClose,
  filterType,
  placeholder,
  options,
  filters,
  handleFilterChange,
}) => {
  const open = activeColumnId === columnId;
  return (
    <>
      <button
        type="button"
        onClick={(event) => handleHeaderClick(event, columnId)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', paddingBottom: '8px',
          border: 'none', background: 'none', cursor: 'pointer', color: 'inherit',
          transition: 'color 150ms ease-in-out', width: '100%', textAlign: 'left', fontFamily: 'Poppins'
        }}
      >
        <span>{label}</span>
        <FiChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease-in-out" }} />
      </button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <FilterPopoverContent
            column={{ id: columnId, label, filterType, placeholder, options }}
            value={filters[columnId]}
            onChange={(value) => handleFilterChange(columnId, value)}
            onClose={handleClose}
        />
      </Popover>
    </>
  );
});

export default function UsersTable({ users = [] }) {
  const [rows, setRows] = useState([]);
  
  // Using the custom hook for editing logic
  const { rowModesModel, setRowModesModel, handleEditClick, handleSaveClick, handleCancelClick } = useRowEditing();

  useEffect(() => {
    const mappedUsers = users.map(u => ({ ...u, active: u.status }));
    setRows(mappedUsers);
  }, [users]);

  // State for filters (specific to this component)
  const [filters, setFilters] = useState({ name: "", email: "", supplier: "", active: "" });
  const [popoverState, setPopoverState] = useState({ anchorEl: null, columnId: null });

  const handleHeaderClick = useCallback((event, columnId) => {
    setPopoverState({ anchorEl: event.currentTarget, columnId });
  }, []);

  const handlePopoverClose = useCallback(() => {
    setPopoverState({ anchorEl: null, columnId: null });
  }, []);

  const supplierOptions = useMemo(() => {
    const uniqueSuppliers = Array.from(new Set(users.map((u) => u.supplier).filter(Boolean)));
    return ["", ...uniqueSuppliers];
  }, [users]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
        const matchesName = !filters.name || row.name?.toLowerCase().includes(filters.name.toLowerCase());
        const matchesEmail = !filters.email || row.email?.toLowerCase().includes(filters.email.toLowerCase());
        const matchesSupplier = !filters.supplier || row.supplier === filters.supplier;
        const matchesActive = !filters.active || row.active === filters.active;
        return matchesName && matchesEmail && matchesSupplier && matchesActive;
    });
  }, [rows, filters]);

  const handleFilterChange = useCallback((columnId, value) => {
    setFilters((previous) => ({ ...previous, [columnId]: value }));
  }, []);

  // --- Component-specific handlers that use the hook's logic ---
  const handleDeleteClick = useCallback((id) => () => {
    const rowToDelete = rows.find(r => r.id === id);
    if (!rowToDelete) return;
    const confirmed = window.confirm(`Remover usuário "${rowToDelete.name}"?`);
    if (confirmed) {
      setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    }
  }, [rows]);

  const processRowUpdate = useCallback((newRow) => {
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === newRow.id ? newRow : row))
    );
    return newRow;
  }, []);
  
  const onProcessRowUpdateError = useCallback((error) => {
    console.error("Error updating row:", error);
  }, []);

  const columns = useMemo(
    () => [
      {
        field: "name", headerName: "Analista de compras", width: 200, editable: true,
        renderHeader: (params) => (
          <CustomFilterHeader
            columnId="name" label="Analista de compras" activeColumnId={popoverState.columnId}
            anchorEl={popoverState.anchorEl} handleHeaderClick={handleHeaderClick}
            handleClose={handlePopoverClose} filterType="text" placeholder="Digite um nome"
            filters={filters} handleFilterChange={handleFilterChange}
          />
        ),
      },
      {
        field: "email", headerName: "Email", width: 250, editable: true,
        renderHeader: (params) => (
          <CustomFilterHeader
            columnId="email" label="email" activeColumnId={popoverState.columnId}
            anchorEl={popoverState.anchorEl} handleHeaderClick={handleHeaderClick}
            handleClose={handlePopoverClose} filterType="text" placeholder="Buscar por email"
            filters={filters} handleFilterChange={handleFilterChange}
          />
        ),
      },
      {
        field: "supplier", headerName: "Fornecedor", width: 150, editable: true,
        type: "singleSelect", valueOptions: supplierOptions.filter(Boolean),
        renderHeader: (params) => (
          <CustomFilterHeader
            columnId="supplier" label="Fornecedor" activeColumnId={popoverState.columnId}
            anchorEl={popoverState.anchorEl} handleHeaderClick={handleHeaderClick}
            handleClose={handlePopoverClose} filterType="select" placeholder="Selecione o fornecedor"
            options={supplierOptions.filter(Boolean)} filters={filters} handleFilterChange={handleFilterChange}
          />
        ),
      },
      {
        field: "active", headerName: "Status", width: 120, editable: true,
        type: "singleSelect", valueOptions: ["Ativo", "Inativo"],
        renderHeader: (params) => (
          <CustomFilterHeader
            columnId="active" label="Status" activeColumnId={popoverState.columnId}
            anchorEl={popoverState.anchorEl} handleHeaderClick={handleHeaderClick}
            handleClose={handlePopoverClose} filterType="select" placeholder="Selecione o status"
            options={["Ativo", "Inativo"]} filters={filters} handleFilterChange={handleFilterChange}
          />
        ),
      },
      {
        field: "actions", type: "actions", headerName: "Ações", width: 100, cellClassName: "actions",
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
    [rowModesModel, filters, popoverState, supplierOptions, handleFilterChange, handleHeaderClick, handlePopoverClose, handleEditClick, handleSaveClick, handleDeleteClick, handleCancelClick]
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
      // sx prop is now in BaseDataGrid, so we use the default header style
    />
  );
}