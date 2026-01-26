import * as XLSX from "xlsx";
import { buildDashboardRows, buildStockRows } from "./csvExporter";

const pad = (n) => String(n).padStart(2, "0");
const formatTimestampForFilename = (d) => {
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}_${pad(
    d.getHours()
  )}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
};

const safePrefixFor = (prefix) => String(prefix).toUpperCase().replace(/[^A-Z0-9_-]/g, "_");

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportRowsXLSX = (rows, prefix = "EXPORT") => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Export");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });

  const safePrefix = safePrefixFor(prefix);
  const filename = `PORTORROL_IBY_EXPORTACAO_${safePrefix}_${formatTimestampForFilename(new Date())}.xlsx`;
  downloadBlob(blob, filename);
};

export const exportStockXLSX = (data) => {
  const rows = buildStockRows(data);
  exportRowsXLSX(rows, "ESTOQUE");
};

export const exportDashboardXLSX = ({ branch, supplier, sku, months, data, dataCritic, statusIndicators, orders = [], budget = null, leadtimeInfo = null }) => {
  const rows = buildDashboardRows({ branch, supplier, sku, months, data, dataCritic, statusIndicators, orders, budget, leadtimeInfo });
  exportRowsXLSX(rows, "DASHBOARD");
};

export default {
  exportRowsXLSX,
  exportStockXLSX,
  exportDashboardXLSX,
};
