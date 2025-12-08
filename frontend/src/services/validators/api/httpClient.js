const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const customFetch = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const config = {
    ...options,
    headers: defaultHeaders,
    credentials: "include", 
  };

  const response = await fetch(url, config);

  const contentType = response.headers.get("content-type");
  let data = null;
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {

    const error = new Error(data?.detail || data?.message || "Erro na requisição");
    error.status = response.status;
    error.data = data;
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