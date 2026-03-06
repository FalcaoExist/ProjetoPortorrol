import httpClient from './validators/api/httpClient'; // Verifique se o caminho do httpClient está correto no seu projeto
import { logger } from "../utils/logger";

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
      logger.error("Erro ao buscar SKUs no backend:", error);
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
      logger.error("Erro ao buscar SKUs:", error);
      throw error;
    }
  },
  getCriticalItems: async (limit = 20, supplier = null, noPendingOnly = false) => {
    try {
      let url = '/dashboard/critics';
      const params = new URLSearchParams();
      params.append('limit', limit);
      
      if (supplier && supplier !== "Todos") {
        params.append('supplier', supplier);
      }

      if (noPendingOnly) {
        params.append('no_pending_only', 'true');
      }

      url += `?${params.toString()}`;
      
      const response = await httpClient.get(url);
      return response.data || response;
    } catch (error) {
      logger.error("Erro ao buscar itens críticos:", error);
      return [];
    }
  },

  getExcessItems: async (limit = 20, supplier = null) => {
    try {
      let url = '/dashboard/excess';
      const params = new URLSearchParams();
      params.append('limit', limit);
      
      if (supplier && supplier !== "Todos") {
        params.append('supplier', supplier);
      }

      url += `?${params.toString()}`;
      
      const response = await httpClient.get(url);
      return response.data || response;
    } catch (error) {
      logger.error("Erro ao buscar itens em excesso:", error);
      return [];
    }
  },

  getFiliais: async () => {
    try {
      const response = await httpClient.get('/dashboard/filiais');
      return response.data || response;
    } catch (error) {
      logger.error("Erro ao buscar filiais:", error);
      throw error;
    }
  },
  getSupplierStatus: async (filial, fornecedor) => {
    try {
      let url = '/dashboard/suppliers/status';
      const params = new URLSearchParams();
      // Se selecionou "Todos" (ou vazio), busca pelo fornecedor especial "TOTAL_GERAL"
      // Caso contrário, busca pelo nome do fornecedor
      const targetSupplier = (fornecedor && fornecedor !== "Todos") ? fornecedor : "TOTAL_GERAL";
      params.append('supplier_name', targetSupplier);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await httpClient.get(url);
      return response.data || response;
    } catch (error) {
      logger.error("Erro ao buscar status do fornecedor:", error);
      // Retorna array vazio ou lança, dependendo da estratégia. 
      // Como o componente espera os dados, melhor retornar array vazio para não quebrar.
      return [];
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
      logger.error("Erro ao buscar histórico:", error);
      throw error;
    }
  },

  getSupplierBudget: async (supplierName = null) => {
    try {
      const url = supplierName && supplierName !== "Todos" 
        ? `/dashboard/budget?supplier=${encodeURIComponent(supplierName)}` 
        : '/dashboard/budget';
      const response = await httpClient.get(url);
      return response.data || response;
    } catch (error) {
      logger.error("Erro ao buscar budget do fornecedor:", error);
      return { valor: 0, start: null, end: null };
    }
  }

};


export default dashboardService;