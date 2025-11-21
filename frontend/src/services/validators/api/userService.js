import  httpClient  from "./httpClient";

export const userService = {
  async getAll() {
    const response = await httpClient.get("/users/all");
    return response.users || [];
  },

  async create(userData) {
    return await httpClient.post("/users", userData);
  },

  async update(id, userData) {
    return await httpClient.put(`/users/${id}`, userData);
  },

  async deactivate(id) {
    // Simulação de envio do ID do gestor logado via Header (conforme seu backend exige)
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const currentUserId = storedUser?.user_id || storedUser?.id;
    
    return await httpClient.request(`/users/${id}/deactivate`, {
        method: 'PUT',
        headers: { "X-User-Id": currentUserId }
    });
  }
};