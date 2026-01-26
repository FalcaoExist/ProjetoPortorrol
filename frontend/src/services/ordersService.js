import httpClient from './validators/api/httpClient';

// Busca todos os pedidos
export const getOrders = async () => {
    try {
        const response = await httpClient.get('/orders');
        return response.data || [];
    } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
        return [];
    }
};

// Atualiza o status de um pedido (ex: Finalizar)
export const updateOrderStatus = async (id, updateData) => {
    try {
        // O updateData deve ser algo como { status: "Finalizado" }
        const response = await httpClient.patch(`/orders/${id}`, updateData);
        return response.data;
    } catch (error) {
        console.error("Erro ao atualizar pedido:", error);
        throw error;
    }
};

// Cria um novo pedido (caso precise no futuro)
export const createOrder = async (orderData) => {
    const response = await httpClient.post('/orders', orderData);
    return response.data;
};