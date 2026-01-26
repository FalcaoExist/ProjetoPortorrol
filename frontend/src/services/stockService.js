import httpClient from './validators/api/httpClient';
import { exportStockCSV } from "./csvExporter";

const mapStockToFrontend = (item) => {
    let rawSupplier = item.primary_supplier || item.supplier_name || item.fornecedor || item.supplier;
    let supplierStr = String(rawSupplier || "").trim();

    if (supplierStr.includes("Padrão") || supplierStr.includes("Default") || supplierStr === "null" || supplierStr === "undefined") {
        supplierStr = "";
    }

    return {
        id: item.sku_id || item.id,
        codigo: item.sku_code || item.codigo || "S/C",
        item: item.name || item.item || "Item sem nome",
        categoria: item.category || item.categoria || "Geral",
        unidades: item.stock_quantity || item.unidades || 0,
        fornecedor: supplierStr, 
        filial: item.branch_name || item.filial || "Matriz",
        dias_cobertura: item.coverage_days || item.dias_cobertura || 0,
        valor: item.unit_price || item.valor || 0,
        _raw: item
    };
};

export const getStockData = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.filial) params.append('filial', filters.filial);
        if (filters.fornecedor) params.append('fornecedor', filters.fornecedor);

        const queryString = params.toString();
        const endpoint = queryString ? `/stock?${queryString}` : '/stock';
        
        const response = await httpClient.get(endpoint);
        const data = Array.isArray(response) ? response : (response.data || []);
        
        return data.map(mapStockToFrontend);
    } catch (error) {
        console.error("Erro ao carregar estoque:", error);
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

        const allSuppliers = data.map(item => {
            const val = item.name || item.supplier_name || item.primary_supplier || item.fornecedor;
            return String(val || "").trim();
        });
        
        const uniqueSuppliers = [...new Set(allSuppliers)]
            .filter(s => s && s !== "null" && s !== "undefined" && !s.includes("Padrão"))
            .sort();
            
        return uniqueSuppliers;
    } catch (error) {
        console.error("Erro ao buscar fornecedores:", error);
        return [];
    }
};

export const createOrderBatch = async (items) => {
    const payload = {
        items: items.map(i => {
            const valorLimpo = String(i.valor).replace(',', '.');
            
            return {
                sku_id: i.id,
                quantity: Number(i.quantidade),
                unit_cost: Number(valorLimpo),
                expected_delivery_date: i.previsao_entrega || null,
                
                supplier_name: i.fornecedor || "Fornecedor Padrão" 
            };
        })
    };
    return await httpClient.post('/orders/batch', payload);
};

export const importStockFromFile = async (file) => {
    return new Promise(resolve => setTimeout(() => resolve({ success: true, message: "Mock Import" }), 1000));
};

export const exportStockData = async (data) => {
    if (!data || data.length === 0) {
        throw new Error("Nenhum dado fornecido para exportação.");
    }

    exportStockCSV(data);

    return Promise.resolve({ message: "Dados do estoque exportados e download iniciado." });
};
