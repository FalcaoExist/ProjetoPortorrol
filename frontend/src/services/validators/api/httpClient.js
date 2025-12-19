// A URL base deve ser vazia ou '/api' para usar o proxy do Vite (definido no vite.config.js)
// Não use 'http://localhost:3000' ou 'http://localhost:8000' aqui para evitar problemas de CORS
const BASE_URL = ""; 

async function request(endpoint, options = {}) {
  // Garante que o endpoint comece com /api se ainda não tiver
  const url = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;

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

    // Se o status não for 2xx, lança um erro para ser capturado pelo try/catch do serviço
    if (!response.ok) {
      throw {
        status: response.status,
        message: data?.detail || data?.message || "Erro na requisição",
        body: data,
      };
    }

    return data;
  } catch (error) {
    console.error(`[httpClient] Erro em ${url}:`, error);
    throw error;
  }
}

// Exporta os métodos HTTP padrão
export default {
  get: (url) => request(url, { method: "GET" }),
  post: (url, body) =>
    request(url, { method: "POST", body: JSON.stringify(body) }),
  put: (url, body) =>
    request(url, { method: "PUT", body: JSON.stringify(body) }),
  delete: (url) => request(url, { method: "DELETE" }),
};