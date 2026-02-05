export const DEFAULT_ACTION_OPTIONS = ["Novo pedido", "Relatórios", "Exclusão", "Login", "Logout"];
export const SEVERITY_COLOR_MAP = { INFO: "default", WARNING: "warning", ERROR: "error" };
export const SEVERITY_OPTIONS = [
  { value: "INFO", label: "Informação" },
  { value: "WARNING", label: "Aviso" },
  { value: "ERROR", label: "Erro" },
];

export const SEVERITY_LABEL_MAP = {
  INFO: "Informação",
  WARNING: "Aviso",
  ERROR: "Erro",
};

export const MAX_DESCRIPTION_LENGTH = 90;

export const FILTER_CONFIG = {
  timestamp: {
    shouldApply: (value) => value && (value.from || value.to),
    predicate: (row, value) => {
      const rowDate = new Date(row.timestamp);
      const fromDate = value.from ? new Date(value.from + "T00:00:00") : null;
      const toDate = value.to ? new Date(value.to + "T23:59:59") : null;
      if (fromDate && rowDate < fromDate) return false;
      if (toDate && rowDate > toDate) return false;
      return true;
    },
  },
  action: {
    shouldApply: (value) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value),
    predicate: (row, value) => {
      const selected = Array.isArray(value)
        ? value
        : value
        ? [value]
        : [];
      if (!selected.length) return true;
      return selected.includes(row.action_label);
    },
  },
  severity: {
    shouldApply: (value) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value),
    predicate: (row, value) => {
      const selected = Array.isArray(value) ? value : [value];
      if (!selected.length) return true;
      return selected.includes(row.severity);
    },
  },
};
