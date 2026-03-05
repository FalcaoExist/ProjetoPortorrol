import httpClient from './validators/api/httpClient';
import { exportStockXLSX } from "./xlsxExporter";
import { logger } from "../utils/logger";

const FILIAL_OPTIONS = ["Porto Alegre", "Joinville", "São Paulo"];

const normalizeFilial = (value) => {
    const text = String(value || "").trim();
    if (!text) return "";
    return FILIAL_OPTIONS.includes(text) ? text : "";
};

// Adicionado o parâmetro 'index' para criar uma chave única
const mapStockToFrontend = (item, index) => {
    let rawSupplier = item.primary_supplier || item.supplier_name || item.fornecedor || item.supplier || item.suppliers?.name;
    let supplierStr = String(rawSupplier || "").trim();

    if (supplierStr.includes("Padrão") || supplierStr.includes("Default") || supplierStr === "null" || supplierStr === "undefined") {
        supplierStr = "";
    }

    const baseId = item.id || item.sku_id || "gen";
    const uniqueReactId = `${baseId}-${index}-${Math.random().toString(36).substr(2, 5)}`;

    return {
        id: uniqueReactId, // ID Único para o DataGrid renderizar sem erros
        real_sku_id: item.sku_id || item.id, // O ID real guardado para quando for criar a encomenda (pedido)
        codigo: item.sku_code || item.codigo || item.tb_skus?.codigo || "S/C",
        item: item.name || item.item || item.tb_skus?.nome_produto || "Item sem nome",
        categoria: item.category || item.categoria || "Geral",
        unidades: item.stock_quantity || item.unidades || item.estoque || item.estoque_soma || 0,
        fornecedor: supplierStr, 
        filial: normalizeFilial(item.filial || item.branch_name || item.branch || item.filial_nome),
        dias_cobertura: item.dias_cobertura, 
        valor: item.unit_price || item.valor || item.preco || item.preco_custo || 0,
        porto_alegre: item.porto_alegre || item.estoque_poa || 0,
        joinville: item.joinville || item.estoque_jv || 0,  
        sao_paulo: item.sao_paulo || item.estoque_sp || 0,
        rop: Math.ceil(item.rop || 0),
        qtd_sugerida: Math.ceil(item.qtd_sugerida || 0),
        leadtime: item.leadtime || 0,
        _raw: item
    };
};

export const getStockData = async (filial, fornecedor, status) => {
    try {
        const args = typeof filial === 'object' ? filial : { filial, fornecedor, status };

        const params = new URLSearchParams();
        if (args.filial && args.filial !== "Todos") params.append('filial', args.filial);
        if (args.fornecedor && args.fornecedor !== "Todos") params.append('fornecedor', args.fornecedor);
        if (args.status && args.status !== "Todos") params.append('status', args.status);

        const queryString = params.toString();
        const endpoint = queryString ? `/stock?${queryString}` : '/stock';
        
        const response = await httpClient.get(endpoint);
        const dataList = Array.isArray(response) ? response : (response.data || []);
        
        // Passa o item e o índice (index) para a função de mapeamento
        return dataList.map((item, index) => mapStockToFrontend(item, index));

    } catch (error) {
        logger.error("Erro ao carregar estoque:", error);
        return [];
    }
};

export const getSuppliers = async () => {
    try {
        let data = [];
        try {
            const res = await httpClient.get('/suppliers');
            data = Array.isArray(res) ? res : (res.data || []);
        } catch (e) {
            const resStock = await httpClient.get('/stock');
            data = Array.isArray(resStock) ? resStock : (resStock.data || []);
        }

        if (data.length > 0 && typeof data[0] === 'string') {
            return data;
        }

        const allSuppliers = data.map(item => {
            const val = item.name || item.supplier_name || item.primary_supplier || item.fornecedor || item.suppliers?.name;
            return String(val || "").trim();
        });
        
        return [...new Set(allSuppliers)]
            .filter(s => s && s !== "null" && s !== "undefined" && !s.includes("Padrão"))
            .sort();
            
    } catch (error) {
        logger.error("Erro ao buscar fornecedores:", error);
        return [];
    }
};

export const createOrderBatch = async (items) => {
    const safeItems = Array.isArray(items) ? items : [];
    const payload = { items: safeItems };

    try {
        const response = await httpClient.post('/orders/batch', payload);
        return response.data || response;
    } catch (error) {
        throw error;
    }
};

export const importStockFromFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

    const response = await fetch(`${API_URL}/stock/import`, {
        method: "POST",
        body: formData,
        // ESTA É A LINHA QUE RESOLVE O 401: Envia o cookie de login para o backend
        credentials: "include",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.detail || data.message || "Erro na requisição de importação");
    }

    return data;
};

export const exportStockData = async (data) => {
    if (!data || data.length === 0) throw new Error("Nenhum dado fornecido para exportação.");
    exportStockXLSX(data);
    return Promise.resolve({ message: "Dados do estoque exportados em Excel e download iniciado." });
};