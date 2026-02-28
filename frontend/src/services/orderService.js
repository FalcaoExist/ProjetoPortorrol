import httpClient from "./validators/api/httpClient";
import { logger } from "../utils/logger";

const orderService = {
    async getAll() {
        try {
            const data = await httpClient.get("/orders");
            // Mapeia resposta do back para colunas da tabela
            return data.map(order => ({
                id: order.order_id,
                // Simula um numero curto visual
                numero_pedido: order.order_id.substring(0, 8).toUpperCase(),
                item: order.item_name,
                fornecedor: order.supplier_name,
                quantidade: order.quantity,
                valor: order.total_value,
                status: order.status,
                data_entrega: order.data_entrega,
                data_pedido: order.created_at || order.data_pedido,
                previsao_entrega: order.data_entrega 
            })) || [];
        } catch (error) {
            logger.error("Erro ao buscar pedidos:", error);
            return [];
        }
    },

    async create(orderData) {
        try {
            // Conversão de dados para o Schema PedidoCreate do Python
            const payload = {
                sku_codigo: orderData.item, // O usuário deve digitar o CÓDIGO ou NOME do produto
                fornecedor_nome: orderData.fornecedor,
                quantidade: Number(orderData.quantidade),
                // Calcula unitário pois o back espera unit_cost
                valor_unitario: Number(orderData.valor) / Number(orderData.quantidade || 1),
                previsao_entrega: orderData.previsao_entrega || null
            };
            return await httpClient.post("/orders", payload);
        } catch (error) {
            throw error;
        }
    },

};

export default orderService;