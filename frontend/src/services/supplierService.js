import httpClient from "./validators/api/httpClient";

const supplierService = {
  async getAll() {
    try {
      const data = await httpClient.get("/suppliers");
      // Mapeamento de campos (Banco -> Frontend)
      return data.map(s => ({
        id: s.supplier_id,      // UUID do banco
        name: s.name,
        leadtime: s.lead_time_days, // Nome da coluna no banco é lead_time_days
        budget: 0, // Campo não existe na tabela suppliers, retorna 0
        active: s.is_active
      })) || [];
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      return [];
    }
  },

  async create(formData) {
    try {
      const payload = {
        name: formData.name,
        lead_time_days: Number(formData.leadtime),
        // Budget ignorado pois não tem no banco
      };
      return await httpClient.post("/suppliers", payload);
    } catch (error) {
      throw error;
    }
  },

  async delete(id) {
    return await httpClient.delete(`/suppliers/${id}`);
  }
};

export default supplierService;