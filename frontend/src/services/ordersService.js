import httpClient from "./validators/api/httpClient";
import { logger } from "../utils/logger";


const normalizeDateOnly = (value) => {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const dateWithoutTimezone = new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
    dateWithoutTimezone.setHours(0, 0, 0, 0);
    return dateWithoutTimezone;
};

const calculateStatus = ({ status, expectedDeliveryDate, deliveredAt }) => {
    if (status === "Finalizado" || deliveredAt) {
        return "Finalizado";
    }

    const normalizedForecastDate = normalizeDateOnly(expectedDeliveryDate);
    if (!normalizedForecastDate) {
        return status || "Aprovado";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return normalizedForecastDate < today ? "Atrasado" : "Aprovado";
};

const resolveOrderIdentifier = (item) => {
    return item.real_id || item._raw?.order_id || (!String(item.id).startsWith("temp") ? item.id : null);
};

const isSameOrderRow = (row, rowId) => {
    return (
        String(row.id) === String(rowId) ||
        String(row.real_id) === String(rowId) ||
        String(row._raw?.order_id) === String(rowId)
    );
};

const normalizeOrdersResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    return [];
};

const mapOrderToFrontend = (item, index) => {
    const finalId = item.id || `temp-${index}`;
    const previsaoRaw = item.expected_delivery_date || item.previsao_entrega || null;
    const entregaRaw = item.data_entrega || null;
    const status = calculateStatus({
        status: item.status,
        expectedDeliveryDate: previsaoRaw,
        deliveredAt: entregaRaw,
    });

    const dataCriacao = item.created_at || item.data_pedido || new Date().toISOString();

    return {
        id: finalId,
        real_id: item.real_id || item.order_id,
        numero_pedido: item.numero_pedido || String(finalId).substring(0, 8).toUpperCase(),
        responsavel: item.responsavel || "Sistema",
        item: item.item_name || item.item || "Item",
        fornecedor: item.supplier_name || item.fornecedor || "Desc.",
        filial: item.branch_name || item.filial || "",
        quantidade: Number(item.quantity || item.quantidade || 0),
        valor: Number(item.total_value || item.valor || 0),
        data_pedido: dataCriacao,
        created_at: dataCriacao,
        previsao_entrega: previsaoRaw,
        data_entrega: entregaRaw,
        status,
        origem: item.origem || "MANUAL",
        _raw: item,
    };
};

const getUpdateHttpMethod = () => {
    if (typeof httpClient.put === "function") return httpClient.put.bind(httpClient);
    if (typeof httpClient.patch === "function") return httpClient.patch.bind(httpClient);
    return httpClient.post.bind(httpClient);
};

const ordersService = {
    async getAll() {
        try {
            const response = await httpClient.get("/orders");
            const data = normalizeOrdersResponse(response);
            return data.map(mapOrderToFrontend);
        } catch (error) {
            logger.error("Erro ao buscar pedidos:", error);
            return [];
        }
    },

    applyFieldUpdateLocally(items, rowId, field, value) {
        if (!Array.isArray(items) || items.length === 0) return [];

        return items.map((row) => {
            if (!isSameOrderRow(row, rowId)) {
                return row;
            }

            const updated = { ...row, [field]: value };

            if (field === "data_entrega") {
                updated.status = calculateStatus({
                    status: updated.status,
                    expectedDeliveryDate: updated.previsao_entrega,
                    deliveredAt: value,
                });
            }

            return updated;
        });
    },

    async persistFieldUpdate(items, rowId, field, value) {
        if (!Array.isArray(items) || items.length === 0) return;

        const itemsToUpdate = items.filter((item) => isSameOrderRow(item, rowId));
        if (itemsToUpdate.length === 0) return;

        const apiField = field === "previsao_entrega" ? "expected_delivery_date" : field;
        const updateMethod = getUpdateHttpMethod();

        await Promise.all(
            itemsToUpdate.map(async (item) => {
                const orderId = resolveOrderIdentifier(item);
                if (!orderId) return;

                const payload = {
                    [apiField]: value,
                    origem: item.origem || "MANUAL",
                };

                if (field === "data_entrega" && value) {
                    payload.status = "Finalizado";
                }

                await updateMethod(`/orders/${orderId}`, payload);
            })
        );
    },

    /**
     * Cria um novo pedido individual.
     * Faz o tratamento de tipos (números) antes de enviar.
     */
    async create(orderData) {
        try {
            const payload = {
                sku_codigo: orderData.item, 
                fornecedor_nome: orderData.fornecedor,
                quantidade: Number(orderData.quantidade),
                valor_unitario: Number(orderData.valor) / Number(orderData.quantidade || 1),
                previsao_entrega: orderData.previsao_entrega || null,
                branch_name: orderData.filial || "Geral"
            };
            
            return await httpClient.post("/orders", payload);
        } catch (error) {
            logger.error("Erro ao criar pedido:", error);
            throw error;
        }
    },
    
    async update(id, updateData) {
        try {
            const response = await httpClient.patch(`/orders/${id}`, updateData);
            return response.data || response;
        } catch (error) {
            logger.error("Erro ao atualizar pedido:", error);
            throw error;
        }
    },

    /**
     * Importa pedidos de arquivo para o backend.
     * O fornecedor é inferido pelo nome do arquivo (`nsk` ou `timken`).
     */
    async importOrdersFromFile(file) {
        const formData = new FormData();
        formData.append("file", file);

        const nome = file.name.toLowerCase();
        let supplier = "";
        if (nome.includes("nsk")) supplier = "nsk";
        else if (nome.includes("timken")) supplier = "timken";
        else {
            throw new Error("Por favor, renomeie o arquivo para incluir 'nsk' ou 'timken' no nome para que o sistema saiba onde salvar.");
        }

        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

        const response = await fetch(`${API_URL}/imports/pedidos/${supplier}`, {
            method: "POST",
            body: formData,
            credentials: "include",
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.detail || data.message || "Erro na importação pelo servidor.");
        }

        return data;
    }
};

export default ordersService;

export const {
    getAll,
    create,
    update,
    importOrdersFromFile,
    applyFieldUpdateLocally,
    persistFieldUpdate,
} = ordersService;