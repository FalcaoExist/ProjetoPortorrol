
import httpClient from "./httpClient";


export async function login(credentials) {
  // credentials: { email, senha } ou { username, password } conforme sua API
  try {
    const res = await httpClient.post("/auth/login", credentials);
    return res;
  } catch (err) {
    // rethrow para o consumidor tratar ou normalizar a mensagem
    throw err;
  }
}

export async function logout() {
  try {
    // se o backend expõe logout, chama; caso contrário, o frontend apenas limpa estado/localStorage
    await httpClient.post("/auth/logout", {});
    return true;
  } catch (err) {
    // Não falhar criticamente no logout — log e continue
    console.warn("authService.logout error:", err);
    return false;
  }
}

export async function getCurrentUser() {
  try {
    const res = await httpClient.get("/auth/me");
    return res;
  } catch (err) {
    throw err;
  }
}

// default export para compatibilidade com import default
export default {
  login,
  logout,
  getCurrentUser,
};