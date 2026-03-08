const getSupplierName = (row = {}) =>
  row.supplier_name || row.fornecedor || row.primary_supplier || row.suppliers?.name || "";

const getPendingUnits = (row = {}) => Number(row.unidades_pendentes || row.pedidos_pendentes || 0);

export function buildSkuCoverageChartData(rows = [], { supplier, getSkuName }) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const isAllSuppliers = !supplier || supplier === "Todos";

  return rows.map((row) => {
    const skuName = String(getSkuName?.(row) || "");
    const supplierName = getSupplierName(row);
    const unitsPending = getPendingUnits(row);
    const displayName = isAllSuppliers && supplierName ? `${skuName} - ${supplierName}` : skuName;

    return {
      ...row,
      skuName,
      displayName,
      displayNameWithIcon: unitsPending > 0 ? `🚚 ${displayName}` : displayName,
      unidades_pendentes: unitsPending,
    };
  });
}

export function resolveSkuNameFromChartData(chartData = [], value) {
  if (!value) return "";

  const found = (chartData || []).find(
    (row) =>
      row.skuName === value ||
      row.displayName === value ||
      row.displayNameWithIcon === value ||
      row.nome_produto === value ||
      row.name === value
  );

  return found?.skuName || found?.nome_produto || value;
}
