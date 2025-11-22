import httpClient from "./httpClient";

/**
 * Busca a lista de usuários do backend.
 * Rota final: GET /api/users (O httpClient ou Proxy adiciona o /api)
 */
export async function getUsers(filters = {}) {
  const params = new URLSearchParams();
  
  // Adiciona filtros na query string se existirem
  if (filters.name) params.append("name", filters.name);
  if (filters.email) params.append("email", filters.email);

  const queryString = params.toString();
  const endpoint = queryString ? `/users?${queryString}` : "/users";

  try {
    const response = await httpClient.get(endpoint);
    
    // O backend retorna { success: true, users: [...], total: ... }
    if (response && response.users) {
        return response.users;
    }
    return [];
  } catch (error) {
    console.error("Erro no serviço getUsers:", error);
    // Retorna array vazio para não quebrar a tabela em caso de erro
    return [];
  }
}

/**
 * Atualiza um usuário existente.
 * Rota final: PUT /api/users/{user_id}
 * @param {string} userId - O ID do usuário (UUID)
 * @param {object} userData - Objeto com os campos a serem atualizados
 */
export async function updateUser(userId, userData) {
  try {
    // O httpClient se encarrega de adicionar o prefixo /api se necessário
    const response = await httpClient.put(`/users/${userId}`, userData);
    
    // O backend retorna: { success: true, user: {...}, message: "..." }
    // Retornamos 'response.user' se existir, ou a resposta inteira como fallback
    return response.user || response;
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error; // Lança o erro para que o componente (UsersTable) possa tratar visualmente
  }
}