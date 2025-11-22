import httpClient from "./httpClient";

// --- IMPORTANTE: A palavra 'export' é obrigatória aqui ---
export async function getUsers(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.name) params.append("name", filters.name);
  if (filters.email) params.append("email", filters.email);

  // Constrói a query string
  const queryString = params.toString();
  const endpoint = queryString ? `/users?${queryString}` : "/users";

  try {
    // O httpClient adiciona o prefixo /api automaticamente
    const response = await httpClient.get(endpoint);
    
    // Garante que retornamos um array, mesmo se a API falhar
    if (response && response.users) {
        return response.users;
    }
    return [];
  } catch (error) {
    console.error("Erro no serviço getUsers:", error);
    return [];
  }
}