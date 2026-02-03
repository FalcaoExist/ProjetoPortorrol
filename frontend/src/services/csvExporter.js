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
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
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
  // Agrupa por referência (código) e monta colunas por filial
  const rows = [];
  rows.push([
    "Referência",
    "Ítem",
    "Categoria",
    "Unidades",
    "Fornecedor",
    "Porto Alegre",
    "Joinville",
    "São Paulo",
    "Dias de Cobertura",
    "Status",
  ]);

  const groups = {};
  (data || []).forEach((r) => {
    const key = r.codigo || String(r.id || "");
    if (!groups[key]) {
      groups[key] = {
        referencia: key,
        item: r.item || "",
        categoria: r.categoria || "",
        fornecedor: r.fornecedor || "",
        portoAlegre: 0,
        joinville: 0,
        saoPaulo: 0,
        totalUnidades: 0,
        diasCoberturaValues: [],
      };
    }

    const unidades = Number.isFinite(Number(r.unidades)) ? Number(r.unidades) : 0;
    groups[key].totalUnidades += unidades;
    if (r.filial && String(r.filial).toLowerCase().includes("porto")) {
      groups[key].portoAlegre += unidades;
    } else if (r.filial && String(r.filial).toLowerCase().includes("join")) {
      groups[key].joinville += unidades;
    } else if (r.filial && String(r.filial).toLowerCase().includes("são") || (r.filial && String(r.filial).toLowerCase().includes("sao"))) {
      groups[key].saoPaulo += unidades;
    }

    if (r.dias_cobertura != null && r.dias_cobertura !== "") {
      const v = Number(r.dias_cobertura);
      if (!Number.isNaN(v)) groups[key].diasCoberturaValues.push(v);
    }
  });

  const getStatusText = (dias) => {
    if (dias <= 30) return "Ruptura iminente";
    if (dias <= 60) return "Subdimensionado";
    if (dias <= 100) return "Ok";
    return "Excesso";
  };

  Object.values(groups).forEach((g) => {
    const dias = g.diasCoberturaValues.length > 0 ? Math.min(...g.diasCoberturaValues) : "";
    rows.push([
      g.referencia || "",
      g.item || "",
      g.categoria || "",
      g.totalUnidades != null ? g.totalUnidades : "",
      g.fornecedor || "",
      g.portoAlegre || 0,
      g.joinville || 0,
      g.saoPaulo || 0,
      dias,
      dias === "" ? "" : getStatusText(dias),
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
