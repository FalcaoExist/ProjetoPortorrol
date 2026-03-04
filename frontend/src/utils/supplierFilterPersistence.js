const SUPPLIER_FILTER_STORAGE_KEY = "selected_supplier_filter";

const getStorageKey = (userId) => {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) return SUPPLIER_FILTER_STORAGE_KEY;
  return `${SUPPLIER_FILTER_STORAGE_KEY}:${normalizedUserId}`;
};

export const getPersistedSupplierFilter = (userId) => {
  try {
    return localStorage.getItem(getStorageKey(userId)) || "";
  } catch (error) {
    return "";
  }
};

export const setPersistedSupplierFilter = (value, userId) => {
  try {
    const normalizedValue = String(value || "").trim();
    const storageKey = getStorageKey(userId);

    if (!normalizedValue) {
      localStorage.removeItem(storageKey);
      return;
    }

    localStorage.setItem(storageKey, normalizedValue);
  } catch (error) {
  }
};
