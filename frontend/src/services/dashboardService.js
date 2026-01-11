import httpClient from "./validators/api/httpClient";

const dashboardService = {
  // Adicionado argumento 'supplier'
  async getSkus(status = null, filial = null, supplier = null) {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (filial) params.append("filial", filial);
    if (supplier) params.append("fornecedor", supplier); // Envia para o back

    try {
      const endpoint = params.toString() ? `/dashboard/skus?${params.toString()}` : "/dashboard/skus";
      const data = await httpClient.get(endpoint);
      return data || [];
    } catch (error) {
      console.error("Erro dashboard skus:", error);
      return [];
    }
  },

  async getFiliais() {
    try {
      return await httpClient.get("/dashboard/filiais");
    } catch (error) {
      return [];
    }
  },

  async searchSkus(query) {
    if (!query) return [];
    try {
      return await httpClient.get(`/dashboard/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      return [];
    }
  },

  async getHistory(skuId) {
    if (!skuId) return [];
    try {
      return await httpClient.get(`/dashboard/history?sku_id=${skuId}`);
    } catch (error) {
      return [];
    }
  }
};

export default dashboardService;