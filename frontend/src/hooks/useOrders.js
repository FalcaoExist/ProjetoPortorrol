import { useState, useEffect, useMemo, useCallback } from "react";
import httpClient from "../services/validators/api/httpClient";

export const useOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [orderDate, setOrderDate] = useState("");

    // Modal (se precisar futuramente)
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedOrderItems, setSelectedOrderItems] = useState([]);

    // --- BUSCA DADOS DO BACKEND ---
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await httpClient.get("/orders");
            // O backend já manda o campo 'id' necessário para o DataGrid
            setOrders(response.data || []);
        } catch (error) {
            console.error("Erro ao buscar pedidos:", error);
            // Em caso de erro, zera a lista para não quebrar a tela
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Carrega ao iniciar
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // --- FILTRAGEM LOCAL ---
    const groupedAndFilteredOrders = useMemo(() => {
        return orders.filter((order) => {
            // 1. Filtro de Texto (Busca por ID, Item ou Fornecedor)
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                searchQuery === "" ||
                (order.order_id && String(order.order_id).toLowerCase().includes(searchLower)) ||
                (order.item_name && order.item_name.toLowerCase().includes(searchLower)) ||
                (order.supplier_name && order.supplier_name.toLowerCase().includes(searchLower));

            // 2. Filtro de Status
            // O backend manda em inglês (PENDING), o front pode usar portugues ou inglês. 
            // Vamos normalizar para garantir.
            let matchesStatus = true;
            if (statusFilter && statusFilter !== "Todos" && statusFilter !== "") {
                const statusMap = {
                    "Pendente": ["PENDING", "DRAFT"],
                    "Aprovado": ["APPROVED", "COMPLETED"],
                    "Cancelado": ["CANCELLED"]
                };
                
                // Se o filtro for uma chave do mapa (ex: "Pendente"), verifica se o status do pedido está na lista
                if (statusMap[statusFilter]) {
                    matchesStatus = statusMap[statusFilter].includes(order.status);
                } else {
                    // Se não, compara direto
                    matchesStatus = order.status === statusFilter;
                }
            }

            // 3. Filtro de Data
            let matchesDate = true;
            if (orderDate) {
                // Backend manda 'created_at' (datetime) ou 'data_entrega' (date)
                // Vamos comparar com a data de criação
                const orderDateStr = order.created_at ? order.created_at.split("T")[0] : "";
                matchesDate = orderDateStr === orderDate;
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [orders, searchQuery, statusFilter, orderDate]);

    // Handlers do Modal
    const handleOpenModal = (orderId) => {
        // Exemplo simples: seleciona o item clicado. 
        // Se quiser agrupar itens do mesmo pedido, filtraria aqui.
        const items = orders.filter(o => o.order_id === orderId);
        setSelectedOrderItems(items);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedOrderItems([]);
    };

    const handleUpdateData = () => {
        fetchOrders();
    };

    return {
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,
        orderDate, setOrderDate,
        modalOpen,
        selectedOrderItems,
        handleOpenModal,
        handleCloseModal,
        groupedAndFilteredOrders, // Lista final para a tabela
        handleUpdateData,
        loading
    };
};