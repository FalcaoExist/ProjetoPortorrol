import { useState, useMemo, useEffect, useCallback } from "react";
import httpClient from "../services/validators/api/httpClient";

// Função utilitária para remover acentos e facilitar a busca
const removeAcentos = (str) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export function useOrders() {
    const [ordersData, setOrdersData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados dos Filtros
    const [searchQuery, setSearchQuery] = useState("");
    const [responsavelFilter, setResponsavelFilter] = useState(""); 
    const [statusFilter, setStatusFilter] = useState("");
    const [orderDate, setOrderDate] = useState("");
    
    // Estados do Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedOrderItems, setSelectedOrderItems] = useState([]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await httpClient.get("/orders");
            
            let rawData = [];
            if (Array.isArray(response)) rawData = response;
            else if (response?.data && Array.isArray(response.data)) rawData = response.data;
            else if (response?.items && Array.isArray(response.items)) rawData = response.items;

            const formattedData = rawData.map((item, index) => {
                const finalId = item.id || `temp-${index}`;
                
                // 🔥 ISOLAMENTO E TRAVA DE ESPELHAMENTO
                const previsaoRaw = item.expected_delivery_date || item.previsao_entrega || null;
                const entregaRaw = item.data_entrega || null;
                
                let statusBinario = item.status || "Aprovado";
                const hoje = new Date();
                hoje.setHours(0,0,0,0);
                
                if (entregaRaw) {
                    const dataEntrega = new Date(entregaRaw);
                    const dataEntregaLimpa = new Date(dataEntrega.valueOf() + dataEntrega.getTimezoneOffset() * 60000);
                    dataEntregaLimpa.setHours(0,0,0,0);
                    
                    if (dataEntregaLimpa <= hoje) {
                        statusBinario = "Aprovado";
                    }
                } else if (previsaoRaw) {
                    const dataPrevisao = new Date(previsaoRaw);
                    const dataPrevisaoLimpa = new Date(dataPrevisao.valueOf() + dataPrevisao.getTimezoneOffset() * 60000);
                    dataPrevisaoLimpa.setHours(0,0,0,0);
                    
                    if (dataPrevisaoLimpa < hoje) {
                        statusBinario = "Atrasado";
                    } else {
                        statusBinario = "Aprovado";
                    }
                }

                const dataCriacao = item.created_at || item.data_pedido || new Date().toISOString();

                return {
                    id: finalId, 
                    real_id: item.real_id || item.order_id, 
                    numero_pedido: item.numero_pedido || String(finalId).substring(0,8).toUpperCase(),
                    responsavel: item.responsavel || "Sistema", 
                    item: item.item_name || item.item || "Item",
                    fornecedor: item.supplier_name || item.fornecedor || "Desc.", 
                    filial: item.branch_name || item.filial || "Matriz", 
                    quantidade: Number(item.quantity || item.quantidade || 0),
                    valor: Number(item.total_value || item.valor || 0),
                    data_pedido: dataCriacao, 
                    created_at: dataCriacao,
                    previsao_entrega: previsaoRaw,
                    data_entrega: entregaRaw, // Aqui a data de entrega entra vazia
                    status: statusBinario,
                    _raw: item 
                };
            });
            setOrdersData(formattedData);
        } catch (error) {
            console.error("Erro busca:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleUpdateData = async (rowId, field, value) => {
        let newStatus = null;

        if (field === "data_entrega" && value) {
            const newDate = new Date(value);
            const today = new Date();
            today.setHours(0,0,0,0);
            const compareDate = new Date(newDate.valueOf() + newDate.getTimezoneOffset() * 60000);
            compareDate.setHours(0,0,0,0);
            
            if (compareDate <= today) {
                newStatus = "Aprovado";
            }
        }

        setOrdersData(prev => prev.map(row => {
            if (row.id === rowId) {
                const updated = { ...row, [field]: value };
                if (newStatus) updated.status = newStatus;
                
                if (field === "data_entrega" && !value && row.previsao_entrega) {
                     const today = new Date();
                     today.setHours(0,0,0,0);
                     const prevDate = new Date(row.previsao_entrega);
                     const prevLimpa = new Date(prevDate.valueOf() + prevDate.getTimezoneOffset() * 60000);
                     prevLimpa.setHours(0,0,0,0);
                     if (prevLimpa < today) updated.status = "Atrasado";
                }
                
                return updated;
            }
            return row;
        }));

        const itemsToUpdate = ordersData.filter(i => i.id === rowId && !String(i.id).startsWith('temp'));

        if (itemsToUpdate.length === 0) return;

        try {
            await Promise.all(itemsToUpdate.map(async (item) => {
                // 🔥 TRADUÇÃO DE CAMPO PARA O BACKEND: se editou a previsão, envia expected_delivery_date
                const apiField = field === "previsao_entrega" ? "expected_delivery_date" : field;
                
                const payload = { [apiField]: value };
                if (newStatus) payload.status = newStatus;

                const idParaSalvar = item.real_id || item._raw?.order_id;
                if (!idParaSalvar) return;

                const url = `/orders/${idParaSalvar}`;

                if (typeof httpClient.put === 'function') {
                    return await httpClient.put(url, payload);
                } else if (typeof httpClient.patch === 'function') {
                    return await httpClient.patch(url, payload);
                } else {
                    return await httpClient.post(url, payload);
                }
            }));
        } catch (err) {
            console.error("ERRO AO SALVAR NA API:", err);
            alert("Erro ao salvar o pedido.");
        }
    };

    const handleOpenModal = (items) => {
        if (Array.isArray(items)) setSelectedOrderItems(items);
        else setSelectedOrderItems([items]);
        setModalOpen(true);
    };

    const groupedAndFilteredOrders = useMemo(() => {
        if (!ordersData.length) return [];
        
        const grouped = ordersData.reduce((acc, item) => {
            const k = item.numero_pedido;
            if (!acc[k]) {
                acc[k] = { 
                    ...item, 
                    items: [], 
                    valor: 0, 
                    quantidade: 0,
                    responsavel: item.responsavel
                };
            }
            acc[k].valor += item.valor;
            acc[k].quantidade += item.quantidade;
            acc[k].items.push(item);
            
            if (item.status === "Atrasado") acc[k].status = "Atrasado";
            return acc;
        }, {});

        return Object.values(grouped).map(o => {
            if (o.items.length > 1) {
                o.item = `${o.items[0].item} (+${o.items.length - 1} itens)`;
            }
            return o;
        }).filter(o => {
            let sText = searchQuery;
            if (sText && typeof sText === 'object' && sText.target) sText = sText.target.value;
            
            let rText = responsavelFilter;
            if (rText && typeof rText === 'object' && rText.target) rText = rText.target.value;

            const s = removeAcentos(String(sText || "").trim());
            const r = removeAcentos(String(rText || "").trim());
            
            const matchItemName = o.items.some(childItem => 
                childItem.item && removeAcentos(String(childItem.item)).includes(s)
            );

            const matchSearch = s === "" || 
                 removeAcentos(String(o.numero_pedido)).includes(s) || 
                 removeAcentos(String(o.fornecedor)).includes(s) ||
                 removeAcentos(String(o.item)).includes(s) || 
                 matchItemName;

            const matchResponsavel = r === "" || removeAcentos(String(o.responsavel)).includes(r);

            let matchDate = true;
            let filterDate = orderDate;
            if (filterDate && typeof filterDate === 'object' && filterDate.target) filterDate = filterDate.target.value;
            
            if (filterDate && String(filterDate).trim() !== "") {
                const searchDate = String(filterDate).trim(); 
                
                let rowDateStr = String(o.data_pedido);
                if (o.data_pedido instanceof Date) {
                    rowDateStr = o.data_pedido.toISOString().split('T')[0];
                } else if (rowDateStr.includes('T')) {
                    rowDateStr = rowDateStr.split('T')[0];
                } else if (rowDateStr.includes(' ')) {
                    rowDateStr = rowDateStr.split(' ')[0];
                }

                matchDate = rowDateStr === searchDate || rowDateStr.includes(searchDate);
            }

            return (
                matchSearch &&
                matchResponsavel && 
                matchDate &&
                (statusFilter === "" || statusFilter === "Todos" || o.status === statusFilter)
            );
        });
    }, [ordersData, searchQuery, responsavelFilter, statusFilter, orderDate]);

    return {
        ordersData, loading, 
        searchQuery, setSearchQuery, 
        responsavelFilter, setResponsavelFilter, 
        statusFilter, setStatusFilter, 
        orderDate, setOrderDate,
        modalOpen, selectedOrderItems, handleOpenModal, handleCloseModal: () => setModalOpen(false),
        groupedAndFilteredOrders, handleUpdateData
    };
}