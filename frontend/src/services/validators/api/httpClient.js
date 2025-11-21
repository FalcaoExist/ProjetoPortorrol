// src/services/validators/api/httpClient.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE}${p}`;
  try {
    console.debug("[httpClient] fetch ->", url, options.method || "GET");
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => null);
      let body = null;
      try { body = text ? JSON.parse(text) : null; } catch (_) { body = text; }
      const err = new Error(`HTTP ${res.status} ${res.statusText}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.error("[httpClient] erro ao chamar API:", err);
    throw err;
  }
}

export async function get(path) {
  return request(path, { method: "GET" });
}
export async function post(path, body) {
  return request(path, { method: "POST", body: JSON.stringify(body) });
}
export async function put(path, body) {
  return request(path, { method: "PUT", body: JSON.stringify(body) });
}
export async function del(path) {
  return request(path, { method: "DELETE" });
}

// named export do objeto
export const httpClient = { get, post, put, del };

// default export compatível
export default { get, post, put, del };