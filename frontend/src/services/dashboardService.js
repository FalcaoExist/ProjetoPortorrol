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
    // REMOVIDO O BLOQUEIO: if (!skuId) return [];
    try {
      // Se tiver ID, manda. Se não, chama a rota limpa para pegar o geral.
      const endpoint = skuId 
        ? `/dashboard/history?sku_id=${skuId}` 
        : `/dashboard/history`;
        
      const data = await httpClient.get(endpoint);
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      return [];
    }
  },
};

export default dashboardService;