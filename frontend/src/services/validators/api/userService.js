import httpClient from "./httpClient";
import { logger } from "../../../utils/logger";

/**
 * Busca a lista de usuários do backend.
 * Rota: GET /api/users
 */
export async function getUsers(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.name) params.append("name", filters.name);
  if (filters.email) params.append("email", filters.email);

  const queryString = params.toString();
  const endpoint = queryString ? `/users?${queryString}` : "/users";

  try {
    const response = await httpClient.get(endpoint);
    // O backend retorna: { success: true, users: [...], total: ... }
    // Garantimos que retornamos um array, mesmo que vazio
    return response.users || [];
  } catch (error) {
    logger.error("Erro no serviço getUsers:", error);
    return [];
  }
}

/**
 * Atualiza um usuário existente.
 * Rota: PUT /api/users/{user_id}
 */
export async function updateUser(userId, userData) {
  try {
    const response = await httpClient.put(`/users/${userId}`, userData);
    return response.user || response;
  } catch (error) {
    logger.error("Erro ao atualizar usuário:", error);
    throw error;
  }
}

/**
 * Exclui um usuário permanentemente.
 * Rota: DELETE /api/users/{user_id}
 */
export async function deleteUser(userId) {
  try {
    await httpClient.delete(`/users/${userId}`);
    return true;
  } catch (error) {
    logger.error("Erro ao excluir usuário:", error);
    throw error;
  }
}