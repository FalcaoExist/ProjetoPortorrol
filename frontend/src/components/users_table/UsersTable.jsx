import { useMemo, useState, useEffect, useCallback } from "react";
import { GridActionsCellItem, GridRowModes } from "@mui/x-data-grid";
import { useMediaQuery } from "@mui/material";
import { FiCheck, FiEdit, FiTrash2, FiX } from "react-icons/fi";

// Hooks Customizados
import { useRowEditing } from "../../hooks/useRowEditing";
import { useEntityFilters } from "../../hooks/useEntityFilters";
import { useColumnPopover } from "../../hooks/useColumnPopover";

// Componentes da UI
import { BaseDataGrid } from "../common/BaseDataGrid";
import CustomFilterHeader from "./CustomFilterHeader";

// Opções para os Selects de Edição
const STATUS_OPTIONS = ["Ativo", "Inativo"];
const ROLE_OPTIONS = ["gestor", "comprador"];

// Configuração dos Filtros
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

export default function UsersTable({ users = [], onDelete, onUpdate }) {
  // Estado local das linhas
  const [rows, setRows] = useState([]);
  
  // Detecção de layout responsivo
  const isCompactLayout = useMediaQuery("(max-width:1279px)");
  
  // Hooks de lógica da tabela
  const { 
    rowModesModel, 
    setRowModesModel, 
    handleEditClick, 
    handleSaveClick, 
    handleCancelClick 
  } = useRowEditing();

  const { 
    anchorEl, 
    activeColumnId, 
    openPopover, 
    closePopover 
  } = useColumnPopover();

  const { 
    filters, 
    handleFilterChange, 
    applyFilters 
  } = useEntityFilters({ config: FILTER_CONFIG });

  // Normalização dos dados vindos do Backend
  useEffect(() => {
    const normalizedUsers = users.map((user) => ({
      ...user,
      // Cria o campo visual 'status' baseado no booleano 'is_active'
      // Isso é necessário para o usuário ver "Ativo" ao invés de "true"
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

  const processRowUpdate = useCallback(async (newRow) => {
      console.log("Iniciando atualização da linha:", newRow);


      const isActiveBoolean = newRow.status === "Ativo";

      let updatedSuppliers = newRow.supplier;
      
      if (typeof updatedSuppliers === 'string') {
          updatedSuppliers = updatedSuppliers.split(',').map(s => s.trim()).filter(Boolean);
      }
      
      // Garante que seja sempre um array
      if (!Array.isArray(updatedSuppliers)) {
          updatedSuppliers = [];
      }

      // 3. Montar o objeto limpo para enviar à API
      const apiData = {
          name: newRow.name,
          email: newRow.email,
          role: newRow.role,
          is_active: isActiveBoolean,
          supplier: updatedSuppliers
      };

    
      if (onUpdate) {
          try {
            
              await onUpdate(newRow.user_id, apiData);
          } catch (error) {
           
              throw error;
          }
      }

  
      const finalRow = { 
          ...newRow, 
          is_active: isActiveBoolean, 
          supplier: updatedSuppliers 
      };
      
      return finalRow;

  }, [onUpdate]);


  const onProcessRowUpdateError = useCallback((error) => {
      console.error("Erro no processRowUpdate:", error);
     
  }, []);


 
  const handleDeleteClick = useCallback((id) => () => { 
      if (onDelete) {
          console.log("Solicitando exclusão para o ID:", id);
          onDelete(id); 
      } else {
          console.warn("Função onDelete não fornecida.");
      }
  }, [onDelete]);

 
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
             // Exibe array como string para leitura
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
                    <GridActionsCellItem 
                        icon={<FiCheck />} 
                        label="Salvar" 
                        onClick={handleSaveClick(id)} 
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
    ],
    [
        anchorEl, 
        activeColumnId, 
        filters, 
        handleFilterChange, 
        supplierOptions, 
        isCompactLayout, 
        rowModesModel, 
        handleDeleteClick 
    ]
  );

  return (
    <BaseDataGrid
      rows={filteredRows}
      columns={columns}
      
     
      getRowId={(row) => row.user_id} 
      
      
      editMode="row"
      rowModesModel={rowModesModel}
      onRowModesModelChange={setRowModesModel}
      
   
      processRowUpdate={processRowUpdate}
      onProcessRowUpdateError={onProcessRowUpdateError}
    />
  );
}