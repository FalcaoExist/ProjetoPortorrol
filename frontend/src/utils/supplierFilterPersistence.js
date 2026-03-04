const SUPPLIER_FILTER_STORAGE_KEY = "selected_supplier_filter";

export const getPersistedSupplierFilter = () => {
  try {
    return localStorage.getItem(SUPPLIER_FILTER_STORAGE_KEY) || "";
  } catch (error) {
    return "";
  }
};

export const setPersistedSupplierFilter = (value) => {
  try {
    const normalizedValue = String(value || "").trim();

    if (!normalizedValue) {
      localStorage.removeItem(SUPPLIER_FILTER_STORAGE_KEY);
      return;
    }

    localStorage.setItem(SUPPLIER_FILTER_STORAGE_KEY, normalizedValue);
  } catch (error) {
  }
};
