export const STOCK_ROUTE = "/stock";

export function buildStockSearchParams({ sku, status, supplier, branch, pendingUnits } = {}) {
  const params = new URLSearchParams();

  if (sku) params.set("sku", sku);
  if (status) params.set("status", status);
  if (supplier && supplier !== "Todos") params.set("supplier", supplier);
  if (branch && branch !== "Todos") params.set("branch", branch);
  if (pendingUnits === "zero" || pendingUnits === 0) params.set("pendingUnits", "zero");

  return params;
}

export function navigateToStock(navigate, options = {}) {
  try {
    const params = buildStockSearchParams(options);
    const query = params.toString();
    const target = query ? `${STOCK_ROUTE}?${query}` : STOCK_ROUTE;

    if (typeof navigate === "function") {
      navigate(target);
      return true;
    }

    if (typeof window !== "undefined") {
      window.location.href = target;
      return true;
    }

    return false;
  } catch {
    if (typeof window !== "undefined") {
      window.location.href = STOCK_ROUTE;
      return true;
    }
    return false;
  }
}
