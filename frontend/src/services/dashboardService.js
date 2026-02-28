import httpClient from './validators/api/httpClient'; // Verifique se o caminho do httpClient está correto no seu projeto

const dashboardService = {

  // ---> ADICIONE ESTA FUNÇÃO AQUI <---
  searchSkus: async (term) => {
    try {
      // Faz a chamada HTTP para a rota nova que adicionamos no Python
      const response = await httpClient.get('/dashboard/search', {
        params: { term }
      });
      // Garante que retorne o array de resultados (dependendo de como o Axios ou Fetch está configurado)
      return response.data || response || [];
    } catch (error) {
      console.error("Erro ao buscar SKUs no backend:", error);
      return [];
    }
  },

  getSkus: async (status, filial, fornecedor) => {
    try {
      let url = '/dashboard/skus';
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (filial && filial !== "Todas") params.append('filial', filial);
      if (fornecedor && fornecedor !== "Todos") params.append('fornecedor', fornecedor);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await httpClient.get(url);
      return response.data || response;
    } catch (error) {
      console.error("Erro ao buscar SKUs:", error);
      throw error;
    }
  },

  getFiliais: async () => {
    try {
      const response = await httpClient.get('/dashboard/filiais');
      return response.data || response;
    } catch (error) {
      console.error("Erro ao buscar filiais:", error);
      throw error;
    }
  },

  getHistory: async (skuId = null) => {
    try {
      let url = '/dashboard/history';
      if (skuId) {
         url += `?sku_id=${skuId}`;
      }
      const response = await httpClient.get(url);
      return response.data || response;
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      throw error;
    }
  }

};

export default dashboardService;