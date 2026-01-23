import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import httpClient from "../services/validators/api/httpClient"; 
export function useOrders() {
    const location = useLocation();
    
    const [ordersData, setOrdersData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState(""); 
    const [orderDate, setOrderDate] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedOrderItems, setSelectedOrderItems] = useState([]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await httpClient.get("/orders");
            const data = response.data || [];
            const hoje = new Date();

            const formattedData = data.map(item => {
                let statusBinario = "Aprovado";

                if (item.data_entrega) {
                    const dataEntrega = new Date(item.data_entrega);
                    dataEntrega.setHours(23, 59, 59);

                    const isBackendFinished = item.status === 'COMPLETED' || item.status === 'APPROVED';
                    
                    if (dataEntrega < hoje && !isBackendFinished) {
                        statusBinario = "Atrasado";
                    }
                }

                return {
                    id: item.id,
                    numero_pedido: item.order_id,   
                    item: item.item_name,           
                    fornecedor: item.supplier_name, 
                    quantidade: item.quantity,
                    filial: "Matriz",               
                    valor: item.total_value,
                    data_pedido: item.created_at ? item.created_at.split('T')[0] : "",
                    previsao_entrega: item.data_entrega,
                    status: statusBinario 
                };
            });

            setOrdersData(formattedData);
        } catch (error) {
            console.error("Erro ao buscar pedidos:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        if (location.state?.newOrders) {
            const newOrders = location.state.newOrders.map(o => ({
                ...o,
                status: "Aprovado" 
            }));

            setOrdersData(prevOrders => {
                const existingIds = new Set(prevOrders.map(o => o.id));
                const uniqueNewOrders = newOrders.filter(o => !existingIds.has(o.id));
                if (uniqueNewOrders.length > 0) {
                    return [...uniqueNewOrders, ...prevOrders];
                }
                return prevOrders;
            });
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const handleOpenModal = (items) => {
        if (typeof items === 'string') {
            const orderId = items;
            const itemsDoPedido = ordersData.filter(o => o.numero_pedido === orderId);
            setSelectedOrderItems(itemsDoPedido);
        } else {
            setSelectedOrderItems(items);
        }
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedOrderItems([]);
    };

    const groupedAndFilteredOrders = useMemo(() => {
        const grouped = ordersData.reduce((acc, item) => {
            if (!acc[item.numero_pedido]) {
                acc[item.numero_pedido] = {
                    id: item.numero_pedido, 
                    numero_pedido: item.numero_pedido,
                    data_pedido: item.data_pedido,
                    fornecedor: item.fornecedor, 
                    valor: 0, 
                    status: item.status, 
                    items: [],
                };
            }
            acc[item.numero_pedido].valor += (Number(item.valor) || 0);
            acc[item.numero_pedido].items.push(item);
            return acc;
        }, {});

        return Object.values(grouped).map(order => {
            const hasDelayedItem = order.items.some(item => item.status === "Atrasado");
            const orderStatus = hasDelayedItem ? "Atrasado" : "Aprovado";
            
            return {
                ...order,
                status: orderStatus,
                valor: order.valor 
            };
        }).filter(order => {
            const searchLower = searchQuery.toLowerCase();
            const numPedido = String(order.numero_pedido || "").toLowerCase();
            const fornec = String(order.fornecedor || "").toLowerCase();

            return (
                (searchQuery === "" || numPedido.includes(searchLower) || fornec.includes(searchLower)) &&
                (statusFilter === "" || statusFilter === "Todos" || order.status === statusFilter) &&
                (orderDate === "" || order.data_pedido === orderDate)
            );
        });
    }, [ordersData, searchQuery, statusFilter, orderDate]);

    const handleUpdateData = (id, field, value) => {
        setOrdersData(currentData =>
            currentData.map(row =>
                row.id === id ? { ...row, [field]: value } : row
            )
        );
    };

    return {
        ordersData,
        loading,
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,
        orderDate, setOrderDate,
        modalOpen,
        selectedOrderItems,
        handleOpenModal,
        handleCloseModal,
        groupedAndFilteredOrders,
        handleUpdateData,
    };
}