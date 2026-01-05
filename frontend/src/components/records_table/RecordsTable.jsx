import { useMemo, useState, useEffect } from "react";
import { useMediaQuery } from "@mui/material";
import { useEntityFilters } from "../../hooks/useEntityFilters";
import { useColumnPopover } from "../../hooks/useColumnPopover";
import { BaseDataGrid } from "../common/BaseDataGrid";
import CustomFilterHeader from "../users_table/CustomFilterHeader";

const DEFAULT_ACTION_OPTIONS = ["Novo pedido", "Relatórios", "Exclusão", "Login", "Logout"];

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
    shouldApply: (value) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value),
    predicate: (row, value) => {
      const selected = Array.isArray(value)
        ? value
        : value
        ? [value]
        : [];
      if (!selected.length) return true;
      return selected.includes(row.action);
    },
  },
};

export default function RecordsTable({ records = [] }) {
  const [rows, setRows] = useState([]);
  const isCompactLayout = useMediaQuery("(max-width:1279px)");
  const { anchorEl, activeColumnId, openPopover, closePopover } = useColumnPopover();
  const { filters, handleFilterChange, applyFilters } = useEntityFilters({ config: FILTER_CONFIG });
  const actionFilterOptions = useMemo(() => {
    const uniqueFromRecords = Array.from(
      new Set(rows.map((row) => row.action).filter(Boolean))
    );
    if (uniqueFromRecords.length) return uniqueFromRecords;
    return DEFAULT_ACTION_OPTIONS;
  }, [rows]);

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
            handleHeaderClick={openPopover}
            handleClose={closePopover}
            filterType="date" // Requer um novo tipo de controle no popover
            filters={filters}
            handleFilterChange={handleFilterChange}
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
            handleHeaderClick={openPopover}
            handleClose={closePopover}
            filterType="multiSelect"
            placeholder="Filtrar ações"
            options={actionFilterOptions}
            filters={filters}
            handleFilterChange={handleFilterChange}
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
    [anchorEl, activeColumnId, filters, handleFilterChange, openPopover, closePopover, isCompactLayout, actionFilterOptions]
  );

  return <BaseDataGrid rows={filteredRows} columns={columns} />;
}
