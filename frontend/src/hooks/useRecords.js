import { useState, useEffect, useMemo } from "react";
import { useEntityFilters } from "../hooks/useEntityFilters";
import { FILTER_CONFIG } from "../components/records_table/constants";

export function useRecords(initialRecords = [], customFilterConfig = null) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    setRows(initialRecords || []);
  }, [initialRecords]);

  const config = customFilterConfig || FILTER_CONFIG;
  const { filters, handleFilterChange, applyFilters } = useEntityFilters({ config });

  const filteredRows = useMemo(() => applyFilters(rows), [applyFilters, rows]);

  const formattedRows = filteredRows;

  const allActionOptions = useMemo(() => {
    const uniqueLabels = Array.from(
      new Set(rows.map((row) => row.action_label).filter(Boolean))
    );
    if (uniqueLabels.length) return uniqueLabels;
    return null;
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