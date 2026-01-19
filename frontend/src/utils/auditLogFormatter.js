const ACTION_CONFIG = {
  // ===== AUTENTICAÇÃO =====
  login: {
    label: "Login",
    severity: "INFO",
    defaultDescription: "Usuário realizou login no sistema.",
  },

  "update password": {
    label: "Atualização de senha",
    severity: "INFO",
    defaultDescription: "Usuário alterou a própria senha.",
  },

  "update user": {
    label: "Atualização de usuário",
  },

  "create user": {
    label: "Criação de usuário",
  },

  // ===== CRUD / DADOS =====
  insert: {
    label: "Inserção de registro",
    severity: "INFO",
  },

  delete: {
    label: "Exclusão de registro",
    severity: "WARNING",
  },

  // ===== IMPORTAÇÃO =====
  "erro importacao": {
    label: "Erro de importação",
    severity: "ERROR",
    overrideDescription:
      "Ocorreu um erro durante a importação dos dados. Consulte os detalhes técnicos.",
  },

  "falha linha importacao": {
    label: "Falha na importação de linha",
    severity: "WARNING",
  },

  "falha arquivo total": {
    label: "Falha total no arquivo",
    severity: "ERROR",
  },

  // ===== SISTEMA / ERRO =====
  "erro fatal": {
    label: "Erro fatal",
    overrideDescription:
      "Ocorreu um erro crítico durante o processamento. Consulte os logs técnicos.",
  },

  debug_colunas_raw: {
    label: "Depuração de colunas (raw)",
  },

  "debug colunas csv": {
    label: "Depuração de colunas CSV",
    severity: "INFO",
  },

  "depuração de colunas": {
    label: "Depuração de colunas",
  },
};

// Normaliza action técnica (caixa, espaços, underscore)
function normalizeAction(action) {
  return action
    .toString()
    .trim()
    .toLowerCase()
    .replace(/_/g, " ");
}

function humanizeFallback(action) {
  return normalizeAction(action)
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function formatAuditAction(action) {
  if (!action) return "-";

  const normalized = normalizeAction(action);
  return ACTION_CONFIG[normalized]?.label ?? humanizeFallback(action);
}

export function formatAuditDescription(action, description) {
  if (!action) return "-";

  const normalized = normalizeAction(action);
  const config = ACTION_CONFIG[normalized];

  if (config?.overrideDescription) {
    return config.overrideDescription;
  }

  if (!description) {
    return config?.defaultDescription ?? "-";
  }

  return description;
}

export function formatAuditSeverity(action) {
  if (!action) return "INFO";

  const normalized = normalizeAction(action);
  return ACTION_CONFIG[normalized]?.severity ?? "INFO";
}

