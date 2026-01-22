// Service responsável por gerar e baixar CSV para o dashboard
export const buildDashboardRows = ({ branch, supplier, sku, months, data, dataCritic, statusIndicators, orders = [], budget = null, leadtimeInfo = null }) => {
  const rows = [];

  // Cabeçalhos em pt-BR
  rows.push(["Seção", "Chave", "Valor"]);
  rows.push(["Filtros", "Filial", branch]);
  rows.push(["Filtros", "Fornecedor", supplier]);
  rows.push(["Filtros", "SKU", sku?.value || ""]);
  rows.push([]);

  rows.push(["Meses", "Mês", "Valor"]);
  months.forEach((m) => rows.push(["Meses", m.month, m.value]));
  rows.push([]);

  // Pedidos
  rows.push(["Pedidos", "Tipo", "Quantidade"]);
  orders.forEach((o) => rows.push(["Pedidos", o.text ?? "", o.number ?? 0]));
  rows.push([]);

  // Gastos / Orçamento
  if (budget) {
    rows.push(["Gastos", "Campo", "Valor"]);
    rows.push(["Gastos", "Gasto", budget.value]);
    rows.push(["Gastos", "Orçamento", budget.budget]);
    rows.push(["Gastos", "Período", `${budget.startDate} - ${budget.endDate}`]);
    rows.push([]);
  }

  rows.push(["Excesso", "Nome", "Quantidade"]);
  data.forEach((d) => rows.push(["Excesso", d.name, d.qtd]));
  rows.push([]);

  rows.push(["Críticos", "Nome", "Quantidade"]);
  dataCritic.forEach((d) => rows.push(["Críticos", d.name, d.qtd]));
  rows.push([]);

  // Leadtime / Saving
  if (leadtimeInfo) {
    rows.push(["LeadtimeSaving", "Campo", "Valor"]);
    rows.push(["LeadtimeSaving", "Leadtime (dias)", leadtimeInfo.leadtime]);
    rows.push(["LeadtimeSaving", "Saving (%)", leadtimeInfo.saving]);
    rows.push([]);
  }

  rows.push(["IndicadoresStatus", "Chave", "Valor"]);
  Object.entries(statusIndicators).forEach(([k, v]) => rows.push(["IndicadoresStatus", k, v]));

  return rows;
};

export const generateCSV = (rows) =>
  rows
    .map((r) =>
      r
        .map((cell) => {
          if (cell === null || cell === undefined) return "";
          const s = String(cell).replace(/"/g, '""');
          return `"${s}"`;
        })
        .join(",")
    )
    .join("\n");

export const downloadCSV = (csv, filename) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportRowsCSV = (rows, prefix = "EXPORT") => {
  const csv = generateCSV(rows);
  const safePrefix = String(prefix).toUpperCase().replace(/[^A-Z0-9_-]/g, "_");
  const filename = `PORTORROL_IBY_EXPORTACAO_${safePrefix}_${formatTimestampForFilename(new Date())}.csv`;
  downloadCSV(csv, filename);
};
export const buildStockRows = (data) => {
  const rows = [];
  rows.push(["Código", "Item", "Categoria", "Unidades", "Fornecedor", "Filial", "Dias de Cobertura"]);
  data.forEach((r) => {
    rows.push([
      r.codigo || "",
      r.item || "",
      r.categoria || "",
      r.unidades != null ? r.unidades : "",
      r.fornecedor || "",
      r.filial || "",
      r.dias_cobertura != null ? r.dias_cobertura : "",
    ]);
  });
  return rows;
};

export const exportStockCSV = (data) => {
  const rows = buildStockRows(data);
  exportRowsCSV(rows, "ESTOQUE");
};

const pad = (n) => String(n).padStart(2, "0");
const formatTimestampForFilename = (d) => {
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}_${pad(
    d.getHours()
  )}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
};

export const exportDashboardCSV = ({ branch, supplier, sku, months, data, dataCritic, statusIndicators, orders, budget, leadtimeInfo }) => {
  const rows = buildDashboardRows({ branch, supplier, sku, months, data, dataCritic, statusIndicators, orders, budget, leadtimeInfo });
  const csv = generateCSV(rows);
  const filename = `PORTORROL_IBY_EXPORTACAO_DASHBOARD_${formatTimestampForFilename(new Date())}.csv`;
  downloadCSV(csv, filename);
};

export default {
  buildDashboardRows,
  generateCSV,
  downloadCSV,
  exportDashboardCSV,
};
