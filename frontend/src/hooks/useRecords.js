import { useState, useEffect, useMemo } from "react";
import { useEntityFilters } from "../hooks/useEntityFilters";
import { FILTER_CONFIG } from "../components/records_table/constants";
import {
  formatAuditAction,
  formatAuditDescription,
  formatAuditSeverity,
} from "../utils/auditLogFormatter";

export function useRecords(initialRecords = [], customFilterConfig = null) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    setRows(initialRecords || []);
  }, [initialRecords]);

  const config = customFilterConfig || FILTER_CONFIG;
  const { filters, handleFilterChange, applyFilters } = useEntityFilters({ config });

  const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);

  const formattedRows = useMemo(() => {
    return filteredRows.map((row) => ({
      ...row,
      actionLabel: formatAuditAction(row.action),
      description: formatAuditDescription(row.action, row.description),
      severity: formatAuditSeverity(row.action),
    }));
  }, [filteredRows]);

  const allActionOptions = useMemo(() => {
    const uniqueLabels = Array.from(
      new Set(rows.map((row) => formatAuditAction(row.action)).filter(Boolean))
    );
    if (uniqueLabels.length) return uniqueLabels;
    return null; // caller may provide defaults
  }, [rows]);

  return {
    formattedRows,
    allActionOptions,
    filters,
    handleFilterChange,
    setRows,
  };
}

export default useRecords;
