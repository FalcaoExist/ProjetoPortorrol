// Service responsável por gerar e baixar CSV para o dashboard
export const buildDashboardRows = ({ branch, supplier, sku, months, data, dataCritic, statusIndicators, orders = [], budget = null, leadtimeInfo = null }) => {
  const rows = [];
  const safeMonths = Array.isArray(months) ? months : [];
  const safeData = Array.isArray(data) ? data : [];
  const safeDataCritic = Array.isArray(dataCritic) ? dataCritic : [];
  const safeStatusIndicators = statusIndicators && typeof statusIndicators === "object" ? statusIndicators : {};

  const normalizeOrders = (value) => {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];

    const approved = Number(value.approved ?? value.aprovados ?? 0);
    const late = Number(value.late ?? value.atrasados ?? 0);

    return [
      { text: "Aprovados", number: Number.isNaN(approved) ? 0 : approved },
      { text: "Atrasados", number: Number.isNaN(late) ? 0 : late },
    ];
  };
  const safeOrders = normalizeOrders(orders);
  const pickFirst = (obj, keys) => {
    for (const key of keys) {
      const value = obj?.[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return "";
  };
  const normalizeSupplier = (value) => {
    if (value && typeof value === "object") {
      return pickFirst(value, ["label", "value", "name", "nome"]);
    }
    return value ?? "";
  };
  const normalizeSku = (value) => {
    if (!value) return "";
    if (typeof value === "object") {
      return pickFirst(value, ["codigo", "sku_code", "label", "value", "name", "nome_produto"]);
    }
    return value;
  };
  const mapMonthRow = (entry) => ({
    month: pickFirst(entry, ["month", "mes", "label", "name"]),
    value: pickFirst(entry, ["value", "qtd", "quantidade", "total", "amount"]),
  });

  // Cabeçalhos em pt-BR
  rows.push(["Seção", "Chave", "Valor"]);
  rows.push(["Filtros", "Filial", branch]);
  rows.push(["Filtros", "Fornecedor", normalizeSupplier(supplier)]);
  rows.push(["Filtros", "SKU", normalizeSku(sku)]);
  rows.push([]);

  rows.push(["Meses", "Mês", "Valor"]);
  safeMonths
    .map(mapMonthRow)
    .forEach((m) => rows.push(["Meses", m.month, m.value]));
  rows.push([]);

  // Pedidos
  rows.push(["Pedidos", "Tipo", "Quantidade"]);
  safeOrders.forEach((o) => rows.push(["Pedidos", o.text ?? "", o.number ?? 0]));
  rows.push([]);

  // Gastos / Orçamento
  if (budget) {
    rows.push(["Gastos", "Campo", "Valor"]);
    rows.push(["Gastos", "Gasto", budget.value]);
    rows.push(["Gastos", "Orçamento", budget.budget]);
    rows.push(["Gastos", "Período", `${budget.startDate} - ${budget.endDate}`]);
    rows.push([]);
  }

  rows.push([
    "Excesso",
    "Nome",
    "Dias de cobertura",
    "classificacao",
    "demanda_diaria",
    "demanda_mensal_media",
    "estoque_atual",
    "fornecedor",
    "ranking_fornecedor",
    "ranking_global",
  ]);
  safeData.forEach((d) => rows.push([
    "Excesso",
    d.name ?? "",
    d.qtd ?? "",
    pickFirst(d, ["classificacao", "classification", "status"]),
    pickFirst(d, ["demanda_diaria", "daily_demand"]),
    pickFirst(d, ["demanda_mensal_media", "monthly_average_demand", "demanda_mensal"]),
    pickFirst(d, ["estoque_atual", "stock", "estoque"]),
    pickFirst(d, ["fornecedor", "supplier_name", "primary_supplier"]),
    pickFirst(d, ["ranking_fornecedor", "supplier_rank"]),
    pickFirst(d, ["ranking_global", "global_rank"]),
  ]));
  rows.push([]);

  rows.push([
    "Críticos",
    "Nome",
    "Dias de cobertura",
    "classificacao",
    "demanda_diaria",
    "demanda_mensal_media",
    "estoque_atual",
    "fornecedor",
    "ranking_fornecedor",
    "ranking_global",
  ]);
  safeDataCritic.forEach((d) => rows.push([
    "Críticos",
    d.name ?? "",
    d.qtd ?? "",
    pickFirst(d, ["classificacao", "classification", "status"]),
    pickFirst(d, ["demanda_diaria", "daily_demand"]),
    pickFirst(d, ["demanda_mensal_media", "monthly_average_demand", "demanda_mensal"]),
    pickFirst(d, ["estoque_atual", "stock", "estoque"]),
    pickFirst(d, ["fornecedor", "supplier_name", "primary_supplier"]),
    pickFirst(d, ["ranking_fornecedor", "supplier_rank"]),
    pickFirst(d, ["ranking_global", "global_rank"]),
  ]));
  rows.push([]);

  // Leadtime / Saving
  if (leadtimeInfo) {
    rows.push(["LeadtimeSaving", "Campo", "Valor"]);
    rows.push(["LeadtimeSaving", "Leadtime (dias)", leadtimeInfo.leadtime]);
    rows.push(["LeadtimeSaving", "Saving (%)", leadtimeInfo.saving]);
    rows.push([]);
  }

  rows.push(["IndicadoresStatus", "Chave", "Valor"]);
  Object.entries(safeStatusIndicators).forEach(([k, v]) => rows.push(["IndicadoresStatus", k, v]));

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
  // Exporta em modo detalhado: 1 linha por registro (sem agrupamento)
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

  const getStatusText = (dias) => {
    if (dias === null || dias === undefined || dias === "") return "Sem demanda";
    if (dias <= 30) return "Ruptura iminente";
    if (dias <= 60) return "Subdimensionado";
    if (dias <= 100) return "Ok";
    return "Excesso";
  };

  (data || []).forEach((r) => {
    const dias = r.dias_cobertura;
    rows.push([
      r.codigo || String(r.id || ""),
      r.item || "",
      r.categoria || "",
      r.unidades != null ? r.unidades : "",
      r.fornecedor || "",
      r.porto_alegre || 0,
      r.joinville || 0,
      r.sao_paulo || 0,
      dias,
      getStatusText(dias),
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
