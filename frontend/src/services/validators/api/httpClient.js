// src/services/validators/api/httpClient.js

// A URL base deve ser vazia ou '/api' para usar o proxy do Vite (definido no vite.config.js)
// Não use 'http://localhost:3000' ou 'http://localhost:8000' aqui
const BASE_URL = ""; 

async function request(endpoint, options = {}) {
  // Garante que o endpoint comece com /api se ainda não tiver
  const url = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${url}`, config);

    // Tenta fazer o parse do JSON
    let data;
    try {
        data = await response.json();
    } catch (e) {
        // Se não for JSON, retorna null ou o texto
        data = null;
    }

    if (!response.ok) {
      throw {
        status: response.status,
        message: data?.detail || data?.message || "Erro na requisição",
        body: data
      };
    }

    return data;
  } catch (error) {
    console.error(`[httpClient] Erro em ${url}:`, error);
    throw error;
  }
}

export default {
  get: (url) => request(url, { method: "GET" }),
  post: (url, body) => request(url, { method: "POST", body: JSON.stringify(body) }),
  put: (url, body) => request(url, { method: "PUT", body: JSON.stringify(body) }),
  delete: (url) => request(url, { method: "DELETE" }),
};