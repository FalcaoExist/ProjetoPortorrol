const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const customFetch = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
// A URL base deve ser vazia ou '/api' para usar o proxy do Vite (definido no vite.config.js)
// Não use 'http://localhost:3000' ou 'http://localhost:8000' aqui para evitar problemas de CORS
const BASE_URL = ""; 

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // -------------------------------------------------------------------------
  // LÓGICA DE AUTENTICAÇÃO: Injeção do Header X-User-Id
  // -------------------------------------------------------------------------
  let userHeader = {};
  try {
    // Tenta recuperar os dados salvos no navegador
    const storedUser = localStorage.getItem("user_data") || localStorage.getItem("user");
    
    if (storedUser) {
      const parsed = JSON.parse(storedUser);

      // O backend (FastAPI) espera o header 'X-User-Id' para auditoria e permissões.
      // O objeto de usuário pode ter o ID em 'user_id', 'userId' ou 'id', dependendo de como foi salvo.
      const userId =
        parsed.user_id ||
        parsed.userId ||
        parsed.id ||
        (parsed.user && parsed.user.id) || // Caso esteja aninhado
        null;

      if (userId) {
        userHeader["X-User-Id"] = String(userId); // Garante que seja string
      }
    }
  } catch (e) {
    console.warn("[httpClient] Não foi possível carregar user do localStorage:", e);
  }
 
  // -------------------------------------------------------------------------
  // CONFIGURAÇÃO DA REQUISIÇÃO
  // -------------------------------------------------------------------------
  const config = {
    ...options,
    headers: defaultHeaders,
    credentials: "include",
  };

  const response = await fetch(url, config);

  const contentType = response.headers.get("content-type") || "";
  let data = null;
  let rawText = null;

  // 204 No Content should not attempt to parse body
  if (response.status === 204) {
    data = null;
  } else if (contentType.includes("application/json")) {
    // Read as text first to safely handle empty bodies
    const text = await response.text();
    rawText = text;
    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        // If JSON parsing fails, keep data as null; handled below if not ok
        data = null;
      }
    } else {
    headers: {
      "Content-Type": "application/json",
      ...userHeader,        // <<<<<< ISSO É O QUE CORRIGE O ERRO 422
      ...options.headers,   // Permite sobrescrever headers se necessário
    },
  };

  try {
    // Executa a chamada ao Backend
    const response = await fetch(`${BASE_URL}${url}`, config);

    // Tenta fazer o parse do JSON de resposta
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // Se não for JSON, retorna null (alguns endpoints retornam vazio, como DELETE)
      data = null;
    }
  } else if (!response.ok) {
    // For non-JSON error responses, capture text for error messages
    rawText = await response.text();
  }

  if (!response.ok) {
    const message = (data && (data.detail || data.message)) || (rawText && rawText.trim()) || "Erro na requisição";
    const error = new Error(message);
    error.status = response.status;
    error.data = data ?? rawText;
    throw error;
  }

  return data;
};

const httpClient = {
  get: (url, options) => customFetch(url, { ...options, method: "GET" }),
  post: (url, body, options) => customFetch(url, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: (url, body, options) => customFetch(url, { ...options, method: "PUT", body: JSON.stringify(body) }),
  delete: (url, options) => customFetch(url, { ...options, method: "DELETE" }),
};

export default httpClient;
