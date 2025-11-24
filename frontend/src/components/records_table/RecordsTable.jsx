import { useMemo, useState, useEffect } from "react";
import { useMediaQuery } from "@mui/material";
import { useEntityFilters } from "../../hooks/useEntityFilters";
import { useColumnPopover } from "../../hooks/useColumnPopover";
import { BaseDataGrid } from "../common/BaseDataGrid";
import CustomFilterHeader from "../users_table/CustomFilterHeader";

// Opções para o filtro de Ação
const ACTION_OPTIONS = ["Novo pedido", "Relatórios", "Exclusão", "Login", "Logout"];

// Regras de filtragem para a tabela de registros
const FILTER_CONFIG = {
  timestamp: {
    shouldApply: (value) => value && (value.from || value.to),
    predicate: (row, value) => {
      const rowDate = new Date(row.timestamp);
      // Normaliza as datas de filtro para o início do dia
      const fromDate = value.from ? new Date(value.from + "T00:00:00") : null;
      const toDate = value.to ? new Date(value.to + "T23:59:59") : null;
      
      if (fromDate && rowDate < fromDate) return false;
      if (toDate && rowDate > toDate) return false;
      return true;
    },
  },
  action: {
    shouldApply: (value) => Boolean(value),
    predicate: (row, value) => row.action === value,
  },
};

export default function RecordsTable({ records = [] }) {
  const [rows, setRows] = useState([]);
  const isCompactLayout = useMediaQuery("(max-width:1279px)");
  const { anchorEl, activeColumnId, openPopover, closePopover } = useColumnPopover();
  const { filters, handleFilterChange, applyFilters } = useEntityFilters({ config: FILTER_CONFIG });

  useEffect(() => {
    setRows(records);
  }, [records]);

  const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);

  const columns = useMemo(
    () => [
      {
        field: "user",
        headerName: "Usuário",
        minWidth: isCompactLayout ? 160 : 200,
        flex: 1,
        headerAlign: "center",
        align: "center",
      },
      {
        field: "timestamp",
        headerName: "Data/Hora",
        type: "dateTime",
        minWidth: isCompactLayout ? 180 : 220,
        flex: 1,
        valueFormatter: (value) => (value ? new Date(value).toLocaleString("pt-BR") : ""),
        headerAlign: "center",
        align: "center",
        renderHeader: () => (
          <CustomFilterHeader
            columnId="timestamp"
            label="Data/Hora"
            activeColumnId={activeColumnId}
            anchorEl={anchorEl}
            onOpen={openPopover}
            onClose={closePopover}
            filterType="date" // Requer um novo tipo de controle no popover
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        ),
      },
      {
        field: "action",
        headerName: "Ação",
        minWidth: isCompactLayout ? 120 : 150,
        flex: 0.7,
        headerAlign: "center",
        align: "center",
        renderHeader: () => (
          <CustomFilterHeader
            columnId="action"
            label="Ação"
            activeColumnId={activeColumnId}
            anchorEl={anchorEl}
            onOpen={openPopover}
            onClose={closePopover}
            filterType="select"
            placeholder="Selecione a ação"
            options={ACTION_OPTIONS}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        ),
      },
      {
        field: "description",
        headerName: "Descrição",
        minWidth: isCompactLayout ? 200 : 300,
        flex: 1.5,
        headerAlign: "center",
        align: "center",
        sortable: false,
      },
    ],
    [anchorEl, activeColumnId, filters, handleFilterChange, openPopover, closePopover, isCompactLayout]
  );

  return <BaseDataGrid rows={filteredRows} columns={columns} />;
}
