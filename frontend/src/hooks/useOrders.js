import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";

const initialOrdersData = [
    { id: 1, numero_pedido: "PED-001", item: "ANEL FRB 100/11,5", fornecedor: "NSK", quantidade: 100, filial: "Porto Alegre", valor: 5000, previsao_entrega: "2024-10-20", status: "Aprovado", data_entrega: null, data_pedido: "2024-07-20" },
    { id: 4, numero_pedido: "PED-001", item: "ROLAMENTO 6203", fornecedor: "NSK", quantidade: 20, filial: "Porto Alegre", valor: 1000, previsao_entrega: "2024-10-20", status: "Aprovado", data_entrega: null, data_pedido: "2024-07-20" },
    { id: 2, numero_pedido: "PED-002", item: "ANEL FRB 100/11,5", fornecedor: "Timken", quantidade: 50, filial: "Joinville", valor: 2500, previsao_entrega: "2024-09-15", status: "Atrasado", data_entrega: null, data_pedido: "2024-08-10" },
    { id: 3, numero_pedido: "PED-003", item: "ANEL FRB 100/11,5", fornecedor: "FRM", quantidade: 200, filial: "São Paulo", valor: 10000, previsao_entrega: "2024-11-01", status: "Aprovado", data_entrega: null, data_pedido: "2024-08-25" },
];

export function useOrders() {
    const location = useLocation();
    const [ordersData, setOrdersData] = useState(initialOrdersData);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [orderDate, setOrderDate] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedOrderItems, setSelectedOrderItems] = useState([]);

    useEffect(() => {
        if (location.state?.newOrders) {
            const newOrders = location.state.newOrders;
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
        setSelectedOrderItems(items);
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
                    items: [],
                };
            }
            acc[item.numero_pedido].items.push(item);
            return acc;
        }, {});

        return Object.values(grouped).map(order => {
            const hasDelayedItem = order.items.some(item => item.status === "Atrasado");
            const orderStatus = hasDelayedItem ? "Atrasado" : "Aprovado";
            
            return {
                ...order,
                status: orderStatus,
            };
        }).filter(order => {
            const searchLower = searchQuery.toLowerCase();
            return (
                (searchQuery === "" || order.numero_pedido.toLowerCase().includes(searchLower)) &&
                (statusFilter === "" || order.status === statusFilter) &&
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
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        orderDate,
        setOrderDate,
        modalOpen,
        selectedOrderItems,
        handleOpenModal,
        handleCloseModal,
        groupedAndFilteredOrders,
        handleUpdateData,
    };
}
