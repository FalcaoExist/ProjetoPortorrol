import httpClient from "./validators/api/httpClient";

/**
 * Serviço unificado para gerenciamento de Pedidos.
 * Substitui: orderService.js e ordersService.js
 */

const ordersService = {
    /**
     * Busca todos os pedidos e faz o mapeamento para o Frontend.
     * Resolve o problema de campos vazios (Data e Valor).
     */
    async getAll() {
        try {
            const data = await httpClient.get("/orders");
            
            // Proteção caso data não seja array
            if (!Array.isArray(data)) return [];

            return data.map(order => ({
                id: order.order_id,
                // Gera um número visual curto se não houver um oficial
                numero_pedido: order.order_id ? order.order_id.substring(0, 8).toUpperCase() : "N/A",
                
                item: order.item_name || "Item desconhecido",
                fornecedor: order.supplier_name || "Fornecedor desconhecido",
                quantidade: order.quantity || 0,
                
                // --- CORREÇÃO DOS CAMPOS VAZIOS ---
                // Mapeia created_at para data_pedido
                data_pedido: order.created_at || order.data_pedido || new Date().toISOString(),
                // Mapeia total_value ou calcula unit_cost * quantity
                valor: order.total_value !== undefined ? order.total_value : (order.unit_cost * order.quantity),
                
                status: order.status || "Pendente",
                data_entrega: order.expected_delivery_date || order.data_entrega || null,
                previsao_entrega: order.expected_delivery_date || null
            }));
        } catch (error) {
            console.error("Erro ao buscar pedidos:", error);
            return [];
        }
    },

    /**
     * Cria um novo pedido individual.
     * Faz o tratamento de tipos (números) antes de enviar.
     */
async create(orderData) {
        try {
            // Conversão EXATA para o Schema PedidoCreate do Backend
            const payload = {
                sku_codigo: orderData.item, 
                fornecedor_nome: orderData.fornecedor,
                quantidade: Number(orderData.quantidade),
                // O backend espera 'valor_unitario' e não 'unit_cost'
                valor_unitario: Number(orderData.valor) / Number(orderData.quantidade || 1),
                // O backend espera 'previsao_entrega'
                previsao_entrega: orderData.previsao_entrega || null 
            };
            
            return await httpClient.post("/orders", payload);
        } catch (error) {
            console.error("Erro ao criar pedido:", error);
            throw error;
        }
    },
    
    /**
     * Atualiza um pedido (ex: mudar Status, Data de Entrega).
     * Unificado do antigo ordersService.js
     */
    async update(id, updateData) {
        try {
            // updateData ex: { status: "Entregue" } ou { expected_delivery_date: "..." }
            const response = await httpClient.patch(`/orders/${id}`, updateData);
            return response.data || response;
        } catch (error) {
            console.error("Erro ao atualizar pedido:", error);
            throw error;
        }
    }
};

// Exportação Padrão (para "import ordersService from ...")
export default ordersService;

// Exportações Nomeadas (para "import { getAll, create } from ...")
export const { getAll, create, update } = ordersService;