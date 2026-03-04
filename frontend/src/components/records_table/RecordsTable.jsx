import { useMemo, useState } from "react";
import { useMediaQuery, Chip, Tooltip, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack } from "@mui/material";
import { useColumnPopover } from "../../hooks/useColumnPopover";
import { BaseDataGrid } from "../common/BaseDataGrid";
import CustomFilterHeader from "../users_table/CustomFilterHeader";

import useRecords from "../../hooks/useRecords";
import {
  DEFAULT_ACTION_OPTIONS,
  SEVERITY_COLOR_MAP,
  SEVERITY_OPTIONS,
  SEVERITY_LABEL_MAP,
  MAX_DESCRIPTION_LENGTH,
} from "./constants";

function truncateText(text, maxLength = MAX_DESCRIPTION_LENGTH) {
  if (!text) return "-";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}

export default function RecordsTable({ records = [] }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
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

  const { formattedRows, allActionOptions: computedActionOptions, filters, handleFilterChange } = useRecords(records);
  const allActionOptions = computedActionOptions || DEFAULT_ACTION_OPTIONS;

  const columns = useMemo(
    () => [
      {
        field: "user",
        headerName: "Usuário",
        minWidth: isCompactLayout ? 160 : 200,
        flex: 1,
        headerAlign: "left",
        align: "left",
      },
      {
        field: "timestamp",
        headerName: "Data/Hora",
        type: "dateTime",
        minWidth: isCompactLayout ? 180 : 220,
        flex: 1,
        valueFormatter: (value) => (value ? new Date(value).toLocaleString("pt-BR") : ""),
        headerAlign: "left",
        align: "left",
        renderHeader: () => (
          <CustomFilterHeader
            columnId="timestamp"
            label="Data/Hora"
            activeColumnId={activeColumnId}
            anchorEl={anchorEl}
            handleHeaderClick={openPopover}
            handleClose={closePopover}
            filterType="date"
            filters={filters}
            handleFilterChange={handleFilterChange}
          />
        ),
      },
      {
        field: "action_label",
        headerName: "Ação",
        minWidth: isCompactLayout ? 120 : 150,
        flex: 0.7,
        headerAlign: "left",
        align: "left",
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
            options={allActionOptions}
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
        headerAlign: "left",
        align: "left",
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
            label={SEVERITY_LABEL_MAP[params.value] ?? params.value}
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
        headerAlign: "left",
        align: "left",
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
    [anchorEl, activeColumnId, filters, handleFilterChange, openPopover, closePopover, isCompactLayout, allActionOptions]
  );

  return (
    <>
      <BaseDataGrid
        rows={formattedRows}
        columns={columns}
        sx={{height:650}}
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

              <Stack direction="row" spacing={2} alignItems="left">
                <Typography>
                  <strong>Ação:</strong> {selectedLog.action_label}
                </Typography>

                <Chip
                  label={SEVERITY_LABEL_MAP[selectedLog.severity] ?? selectedLog.severity}
                  color={SEVERITY_COLOR_MAP[selectedLog.severity] ?? "default"}
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
