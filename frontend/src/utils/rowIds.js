// Utilitários de ID estável para DataGrids.

export const getStockRowId = (row) => {
    const filial = row?.filial ?? row?.branch ?? row?.filial_nome;
    const baseId = row?.id ?? row?.sku_id ?? row?.codigo ?? row?.referencia;

    if (baseId == null) return "";
    if (filial != null && String(filial).trim() !== "") return `${baseId}-${filial}`;
    return String(baseId);
};
