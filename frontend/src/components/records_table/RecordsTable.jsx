import { useMemo, useState, useEffect } from "react";
import { useMediaQuery, Chip, Tooltip, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack } from "@mui/material";
import { useEntityFilters } from "../../hooks/useEntityFilters";
import { useColumnPopover } from "../../hooks/useColumnPopover";
import { BaseDataGrid } from "../common/BaseDataGrid";
import CustomFilterHeader from "../users_table/CustomFilterHeader";
import { formatAuditAction, formatAuditDescription, formatAuditSeverity } from "../../utils/auditLogFormatter";

const DEFAULT_ACTION_OPTIONS = ["Novo pedido", "Relatórios", "Exclusão", "Login", "Logout"];
const SEVERITY_COLOR_MAP = { INFO: "default", WARNING: "warning", ERROR: "error"};
const SEVERITY_OPTIONS = ["INFO", "WARNING", "ERROR"];
const [detailsOpen, setDetailsOpen] = useState(false);
const [selectedLog, setSelectedLog] = useState(null);

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
      return selected.includes(row.actionLabel);
    },
  },
  severity: {
    shouldApply: (value) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value),
    predicate: (row, value) => {
      const selected = Array.isArray(value) ? value : [value];
      if (!selected.length) return true;
      return selected.includes(row.severity);
    },
  },
};

const MAX_DESCRIPTION_LENGTH = 90;

function truncateText(text, maxLength = MAX_DESCRIPTION_LENGTH) {
  if (!text) return "-";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

export default function RecordsTable({ records = [] }) {
  const [rows, setRows] = useState([]);
  const openDetails = (row) => {
    setSelectedLog(row);
    setDetailsOpen(true);
  };
  const closeDetails = () => {
    setDetailsOpen(false);
    setSelectedLog(null);
  };
  const isCompactLayout = useMediaQuery("(max-width:1279px)");
  const { anchorEl, activeColumnId, openPopover, closePopover } = useColumnPopover();
  const { filters, handleFilterChange, applyFilters } = useEntityFilters({ config: FILTER_CONFIG });
  const actionFilterOptions = useMemo(() => {
    const uniqueLabels = Array.from(
      new Set(
        formattedRows.map((row) => row.actionLabel).filter(Boolean)
      )
    );
    if (uniqueLabels.length) return uniqueLabels;
    return DEFAULT_ACTION_OPTIONS;
  }, [formattedRows]);

  useEffect(() => {
    setRows(records);
  }, [records]);

  const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);

  const formattedRows = useMemo(() => {
    return filteredRows.map((row) => ({
      ...row,
      actionLabel: formatAuditAction(row.action),
      description: formatAuditDescription(row.action, row.description),
      severity: formatAuditSeverity(row.action),
    }));
  }, [filteredRows]);

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
        field: "actionLabel",
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
        field: "severity",
        headerName: "Severidade",
        minWidth: 130,
        flex: 0.6,
        headerAlign: "center",
        align: "center",
        sortable: false,
        renderHeader: () => (
          <CustomFilterHeader
            columnId="severity"
            label="Severidade"
            activeColumnId={activeColumnId}
            anchorEl={anchorEl}
            handleHeaderClick={openPopover}
            handleClose={closePopover}
            filterType="multiSelect"
            placeholder="Filtrar severidade"
            options={SEVERITY_OPTIONS}
            filters={filters}
            handleFilterChange={handleFilterChange}
          />
        ),
        renderCell: (params) => (
          <Chip
            label={params.value}
            color={SEVERITY_COLOR_MAP[params.value] ?? "default"}
            size="small"
            variant="outlined"
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
        renderCell: (params) => {
          const fullText = params.value;
          const truncated = truncateText(fullText);

          if (!fullText || fullText.length <= MAX_DESCRIPTION_LENGTH) {
            return truncated;
          }

          return (
            <Tooltip title="Clique para ver detalhes" arrow>
              <Typography
                variant="body2"
                sx={{
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  color: "primary.main",
                }}
                onClick={() => openDetails(params.row)}
              >
                {truncated}
              </Typography>
            </Tooltip>
          );
        },
      },
    ],
    [anchorEl, activeColumnId, filters, handleFilterChange, openPopover, closePopover, isCompactLayout, actionFilterOptions]
  );

  return (
    <>
      <BaseDataGrid
        rows={formattedRows}
        columns={columns}
      />

      <Dialog
        open={detailsOpen}
        onClose={closeDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalhes do Registro</DialogTitle>

        <DialogContent dividers>
          {selectedLog && (
            <Stack spacing={2}>
              <Typography>
                <strong>Usuário:</strong> {selectedLog.user}
              </Typography>

              <Typography>
                <strong>Data/Hora:</strong>{" "}
                {new Date(selectedLog.timestamp).toLocaleString("pt-BR")}
              </Typography>

              <Stack direction="row" spacing={2} alignItems="center">
                <Typography>
                  <strong>Ação:</strong> {selectedLog.actionLabel}
                </Typography>

                <Chip
                  label={selectedLog.severity}
                  color={
                    SEVERITY_COLOR_MAP[selectedLog.severity] ?? "default"
                  }
                  size="small"
                  variant="outlined"
                />
              </Stack>

              <Typography>
                <strong>Descrição completa:</strong>
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  backgroundColor: "#f5f5f5",
                  padding: 2,
                  borderRadius: 1,
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                }}
              >
                {selectedLog.description}
              </Typography>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDetails}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
