import httpClient from "./validators/api/httpClient";
import { logger } from "../utils/logger";

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

            return data.map(order => {
                // Identifica se o registro vem de uma importação externa (NSK/TIMKEN)
                const isImported = order.responsavel === "Importado" || order.origem === "NSK" || order.origem === "TIMKEN";

                return {
                    // ID único para o DataGrid
                    id: order.id || order.order_id,
                    
                    // Número visual do pedido (prioriza o que vem do back ou gera um curto)
                    numero_pedido: order.numero_pedido || (order.order_id ? order.order_id.substring(0, 8).toUpperCase() : "N/A"),
                    
                    item: order.item_name || order.item || "Item desconhecido",
                    fornecedor: order.supplier_name || order.fornecedor || "Fornecedor desconhecido",
                    
                    // Regra: quantidade é o campo unificado (que no import era qtd_confirmada)
                    quantidade: Number(order.quantity || order.quantidade || 0),
                    
                    // --- CORREÇÃO DOS CAMPOS VAZIOS E REGRAS DE IMPORTAÇÃO ---
                    
                    // Regra: Responsável nomeado como "Importado" se for externo
                    responsavel: order.responsavel || (isImported ? "Importado" : "Sistema"),

                    // Regra: Valor já vem multiplicado do backend ou calcula-se aqui por segurança
                    valor: Number(order.valor || 0),
                    
                    // Mapeia created_at para data_pedido
                    data_pedido: order.created_at || order.data_pedido || new Date().toISOString(),

                    // Regra: previsao_entrega recebe a data_solicitada do import
                    previsao_entrega: order.expected_delivery_date || order.previsao_entrega || order.data_solicitada || "N/A",

                    // Regra: data_entrega recebe a data confirmada/entregue do import
                    data_entrega: order.data_entrega || order.data_confirmada || "Pendente",
                    
                    status: order.status || (isImported ? "Importado" : "Pendente"),
                    origem: order.origem || "Manual",

                    // --- ADIÇÃO DE CONEXÃO E VÍNCULO ---
                    // Identifica se este pedido importado está conectado a um pedido manual
                    vinculado: !!order.purchase_order_id,
                    purchase_order_id: order.purchase_order_id || null
                };
            });
        } catch (error) {
            logger.error("Erro ao buscar pedidos:", error);
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
                previsao_entrega: orderData.previsao_entrega || null,
                branch_name: orderData.filial || "Geral"
            };
            
            return await httpClient.post("/orders", payload);
        } catch (error) {
            logger.error("Erro ao criar pedido:", error);
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
            logger.error("Erro ao atualizar pedido:", error);
            throw error;
        }
    },

    /**
     * Importa pedidos de um arquivo Excel para o banco de dados via Backend.
     */
    async importOrdersFromFile(file) {
        const formData = new FormData();
        formData.append("file", file);
        
        // Descobre se é NSK ou TIMKEN pelo nome do arquivo
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
            credentials: "include", // Envia a sessão/cookie para não dar Erro 401
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.detail || data.message || "Erro na importação pelo servidor.");
        }

        return data;
    }
};

// Exportação Padrão (para "import ordersService from ...")
export default ordersService;

// Exportações Nomeadas (para "import { getAll, create } from ...")
export const { getAll, create, update, importOrdersFromFile } = ordersService;