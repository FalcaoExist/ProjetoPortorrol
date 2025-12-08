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