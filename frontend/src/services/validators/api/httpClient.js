// src/services/validators/api/httpClient.js

const API_URL = import.meta.env.VITE_API_URL || "";

const customFetch = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;

  // LÓGICA DE HEADER DE USUÁRIO (Mantenha como estava)
  let userHeader = {};
  try {
    const storedUser = localStorage.getItem("user_data") || localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      const userId = parsed.user_id || parsed.userId || parsed.id;
      if (userId) {
        userHeader["X-User-Id"] = userId;
      }
    }
  } catch (error) {
    console.warn("Erro ao ler localStorage:", error);
  }

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...userHeader,
      ...options.headers,
    },
    // 👇 ADICIONE ESTA LINHA OBRIGATORIAMENTE 👇
    credentials: "include", 
    // 👆 Isso permite que o Cookie de sessão vá e volte entre Frontend e Backend
  };

  try {
    const response = await fetch(url, config);

    let data;
    let rawText;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      rawText = await response.text();
    }

    if (!response.ok) {
      // Se for 401 no endpoint /me, é apenas sessão expirada, não precisa poluir o console com erro crítico
      if (response.status === 401 && endpoint.includes("/me")) {
         throw new Error("Sessão expirada");
      }

      const message = (data && (data.detail || data.message)) || (rawText && rawText.trim()) || "Erro na requisição";
      const error = new Error(message);
      error.status = response.status;
      error.data = data || rawText;
      throw error;
    }

    return data;

  } catch (error) {
    throw error;
  }
};

const httpClient = {
  get: (url, options) => customFetch(url, { ...options, method: "GET" }),
  post: (url, body, options) => customFetch(url, { ...options, method: "POST", body: JSON.stringify(body) }),
  put: (url, body, options) => customFetch(url, { ...options, method: "PUT", body: JSON.stringify(body) }),
  delete: (url, options) => customFetch(url, { ...options, method: "DELETE" }),
};

export default httpClient;