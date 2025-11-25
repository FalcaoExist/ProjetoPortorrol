import React, { useMemo, useState, useEffect, useCallback } from "react";
import { GridActionsCellItem, GridRowModes, useGridApiContext } from "@mui/x-data-grid";
import { Popover } from "@mui/material";
import { FiX, FiChevronDown, FiCheck, FiEdit, FiTrash2 } from "react-icons/fi";
import FilterPopoverContent from "./FilterPopoverContent";
import { useRowEditing } from "../../hooks/useRowEditing";
import { BaseDataGrid } from "../common/BaseDataGrid";

// ---------------------------------------------------------------------------
// COMPONENTE: SupplierEditCell
// ---------------------------------------------------------------------------
// Componente customizado para renderizar a célula de edição da coluna "Fornecedor".
// Diferente de um select nativo, ele usa um Popover para permitir a seleção
// de múltiplos fornecedores de forma visualmente amigável (sem scroll interno na célula).
//
// Props:
// - id: ID da linha sendo editada.
// - value: Valor atual da célula (array de strings).
// - field: Nome do campo na grid ("supplier").
// - options: Lista de opções disponíveis para seleção.
// ---------------------------------------------------------------------------
function SupplierEditCell({ id, value, field, options }) {
  const apiRef = useGridApiContext();
  const [anchorEl, setAnchorEl] = useState(null);

  // Garante que o valor seja sempre um array para evitar erros no .includes()
  const selectedValues = Array.isArray(value) ? value : [];

  // Abre o popover ao clicar na célula (simulando um dropdown)
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Lógica de toggle para adicionar/remover item do array de seleção
  const toggleOption = (option) => {
    const newValues = selectedValues.includes(option)
      ? selectedValues.filter((v) => v !== option) // Remove se já existe
      : [...selectedValues, option]; // Adiciona se não existe
    
    // Atualiza imediatamente o estado interno da Grid com o novo valor
    apiRef.current.setEditCellValue({ id, field, value: newValues });
  };

  const open = Boolean(anchorEl);

  return (
    <div className="w-full h-full relative">
      {/* Renderização do "Input" visual na célula.
          Mostra os valores selecionados separados por vírgula ou um placeholder.
      */}
      <div 
        onClick={handleClick}
        className="w-full h-full border border-gray-300 rounded-md px-2 py-1 text-sm font-poppins bg-white cursor-pointer flex items-center overflow-hidden hover:border-gray-400 transition-colors"
      >
        <span className="truncate text-gray-700">
          {selectedValues.length > 0 ? selectedValues.join(", ") : <span className="text-gray-400 italic">Selecione...</span>}
        </span>
        <FiChevronDown className="ml-auto text-gray-400 min-w-[14px]" size={14} />
      </div>
      
      {/* Menu Flutuante (Popover) com as opções.
          Renderizado fora da célula para não ser cortado pelo overflow da tabela.
      */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
            // Garante que o menu tenha pelo menos a largura da célula
            style: { minWidth: anchorEl ? anchorEl.clientWidth : 'auto', marginTop: '4px' }
        }}
      >
        <div className="p-1 bg-white rounded-md shadow-lg border border-gray-100 flex flex-col max-h-60 overflow-y-auto">
           {options.map((opt) => {
             const isSelected = selectedValues.includes(opt);
             return (
               <div 
                 key={opt} 
                 onClick={() => toggleOption(opt)}
                 className={`
                    px-3 py-2 cursor-pointer flex items-center gap-3 text-sm font-poppins rounded-md transition-colors
                    ${isSelected ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50 text-gray-700'}
                 `}
               >
                 {/* Checkbox customizado para indicar seleção */}
                 <div className={`
                    w-4 h-4 border rounded flex items-center justify-center transition-all
                    ${isSelected ? 'bg-[#5A44B0] border-[#5A44B0]' : 'border-gray-300 bg-white'}
                 `}>
                    {isSelected && <FiCheck size={10} className="text-white" />}
                 </div>
                 <span>{opt}</span>
               </div>
             );
           })}
        </div>
      </Popover>
    </div>
  );
}

// ---------------------------------------------------------------------------
// COMPONENTE: CustomFilterHeader
// ---------------------------------------------------------------------------
// Renderiza o cabeçalho da coluna com um ícone de filtro e controla o Popover de filtro.
// Utiliza React.memo para evitar re-renderizações desnecessárias quando outras partes da tabela mudam.
// ---------------------------------------------------------------------------
const CustomFilterHeader = React.memo(({
  columnId, label, activeColumnId, anchorEl, handleHeaderClick, handleClose, filterType, placeholder, options, filters, handleFilterChange,
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
        {/* Seta que gira quando o filtro está ativo/aberto */}
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

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL: UsersTable
// ---------------------------------------------------------------------------
export default function UsersTable({ users = [], onDelete, onUpdate, availableSuppliers = [] }) {
  const [rows, setRows] = useState([]);
  
  // Hook customizado para gerenciar o estado de edição (Edit/View mode) de cada linha
  const { rowModesModel, setRowModesModel, handleEditClick, handleSaveClick, handleCancelClick } = useRowEditing();

  // Sincroniza o estado local das linhas com a prop 'users' vinda da API
  useEffect(() => {
    const mappedUsers = users.map(u => ({ 
        ...u, 
        id: u.user_id, // Mapeia user_id para id (exigido pelo DataGrid)
        active: u.is_active ? "Ativo" : "Inativo" // Formata booleano para texto
    }));
    setRows(mappedUsers);
  }, [users]);

  // Estados para controle dos filtros locais
  const [filters, setFilters] = useState({ name: "", email: "", supplier: "", active: "" });
  // Estado para controlar qual Popover de filtro está aberto
  const [popoverState, setPopoverState] = useState({ anchorEl: null, columnId: null });

  const handleHeaderClick = useCallback((event, columnId) => {
    setPopoverState({ anchorEl: event.currentTarget, columnId });
  }, []);

  const handlePopoverClose = useCallback(() => {
    setPopoverState({ anchorEl: null, columnId: null });
  }, []);

  // Define as opções de fornecedores. Se não vier via props, usa fallback.
  const supplierOptions = useMemo(() => {
    if (availableSuppliers.length > 0) return availableSuppliers; 
    return ["Timken", "NSK", "SKF", "Fag", "Schaeffler"];
  }, [availableSuppliers]);

  // Opções para o filtro de fornecedores (adiciona opção vazia no início)
  const filterSupplierOptions = useMemo(() => ["", ...supplierOptions], [supplierOptions]);

  // Lógica de filtragem local (Client-side Filtering)
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
        const matchesName = !filters.name || row.name?.toLowerCase().includes(filters.name.toLowerCase());
        const matchesEmail = !filters.email || row.email?.toLowerCase().includes(filters.email.toLowerCase());
        
        // Lógica especial para filtrar array de fornecedores:
        // Verifica se o array da linha contém o valor selecionado no filtro
        const matchesSupplier = !filters.supplier || (Array.isArray(row.supplier) ? row.supplier.includes(filters.supplier) : row.supplier === filters.supplier);
        
        const matchesActive = !filters.active || row.active === filters.active;
        return matchesName && matchesEmail && matchesSupplier && matchesActive;
    });
  }, [rows, filters]);

  const handleFilterChange = useCallback((columnId, value) => {
    setFilters((previous) => ({ ...previous, [columnId]: value }));
  }, []);

  // Processa a atualização da linha ao clicar em "Salvar"
  const processRowUpdate = async (newRow) => {
    try {
        // Normalização: Garante que o campo supplier seja sempre enviado como array para o backend
        let supplierPayload = newRow.supplier;
        if (typeof supplierPayload === 'string') {
            supplierPayload = [supplierPayload];
        } else if (!supplierPayload) {
            supplierPayload = [];
        }

        const updatedData = {
            name: newRow.name,
            email: newRow.email,
            is_active: newRow.active === "Ativo",
            supplier: supplierPayload 
        };
        
        // Chama a função de update passada pelo pai (que chama a API)
        const result = await onUpdate(newRow.id, updatedData);
        
        // Retorna a linha atualizada com os dados confirmados pelo backend
        return { ...newRow, ...result, active: result.is_active ? "Ativo" : "Inativo" };
    } catch (error) {
        return Promise.reject(error); // Rejeita a promessa para manter a linha em modo de edição se falhar
    }
  };

  const onProcessRowUpdateError = (error) => {
    console.error("Erro ao atualizar linha:", error);
  };

  // Definição das Colunas
  const columns = useMemo(
    () => [
      {
        field: "name", 
        headerName: "Analista de compras", 
        flex: 1.2, // Ocupa 20% a mais que o padrão
        minWidth: 200, 
        editable: true,
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
        flex: 1.45, // Ocupa ~20% a mais que o nome
        minWidth: 250, 
        editable: true,
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
        flex: 1.55, // Reduzido para compensar o aumento das outras colunas
        minWidth: 300, 
        editable: true,
        // Renderiza o componente customizado para edição múltipla
        renderEditCell: (params) => (
            <SupplierEditCell {...params} options={supplierOptions} />
        ),
        // Formata visualmente o array [A, B] para "A, B" quando não está editando
        valueFormatter: (value) => Array.isArray(value) ? value.join(", ") : value,
        renderHeader: () => (
          <CustomFilterHeader
            columnId="supplier" label="Fornecedor" activeColumnId={popoverState.columnId}
            anchorEl={popoverState.anchorEl} handleHeaderClick={handleHeaderClick}
            handleClose={handlePopoverClose} filterType="select" placeholder="Filtrar fornecedor"
            options={filterSupplierOptions} filters={filters} handleFilterChange={handleFilterChange}
          />
        ),
      },
      {
        field: "active", headerName: "Status", width: 120, editable: true,
        type: "singleSelect", valueOptions: ["Ativo", "Inativo"],
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
            <GridActionsCellItem icon={<FiTrash2 />} label="Excluir" onClick={() => onDelete(id)} color="inherit" />,
          ];
        },
      },
    ],
    [rowModesModel, filters, popoverState, supplierOptions, filterSupplierOptions, handleFilterChange, handleHeaderClick, handlePopoverClose, handleEditClick, handleSaveClick, onDelete, handleCancelClick]
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
      // sx prop: Ajustes de CSS direto na grid.
      // Aqui aumentamos levemente o padding vertical durante a edição para acomodar o input customizado.
      sx={{
        "& .MuiDataGrid-row--editing .MuiDataGrid-cell": {
            paddingTop: "2px",
            paddingBottom: "2px",
        }
      }}
    />
  );
}