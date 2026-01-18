import { useState, useMemo, useCallback, useEffect } from "react";

const getStatusText = (diasDeCobertura) => {
    if (diasDeCobertura <= 30) return "Ruptura iminente";
    if (diasDeCobertura <= 60) return "Subdimensionado";
    if (diasDeCobertura <= 100) return "OK";
    return "Excesso";
};

export const useStock = (initialStockData = []) => {
    const [stockData] = useState(initialStockData);
    const [isNewOrderVisible, setIsNewOrderVisible] = useState(false);
    const [rowSelectionModel, setRowSelectionModel] = useState({ type: 'include', ids: new Set() });
    const [newOrderRows, setNewOrderRows] = useState([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [fornecedor, setFornecedor] = useState("");
    const [filial, setFilial] = useState("");

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        const selectionSet = rowSelectionModel.ids || new Set();
        setNewOrderRows(prevOrderRows => {
            const selectedRows = stockData
                .filter(row => selectionSet.has(row.id))
                .map(item => {
                    const existingItem = prevOrderRows.find(nr => nr.id === item.id);
                    return existingItem || {
                        ...item,
                        unidades: 1,
                        valor: item.valor || 0,
                        previsao_entrega: new Date()
                    };
                });
            return selectedRows;
        });
    }, [rowSelectionModel, stockData]);

    const filteredRows = useMemo(() => {
        return stockData.filter(row => {
            const statusText = getStatusText(row.dias_cobertura);
            return (
                (searchQuery === "" || row.item.toLowerCase().includes(searchQuery.toLowerCase()) || row.codigo.toLowerCase().includes(searchQuery.toLowerCase())) &&
                (statusFilter === "" || statusText === statusFilter) &&
                (fornecedor === "" || row.fornecedor === fornecedor) &&
                (filial === "" || row.filial === filial)
            );
        });
    }, [stockData, searchQuery, statusFilter, fornecedor, filial]);

    const handleShowNewOrder = useCallback(() => {
        if (!isNewOrderVisible) {
            const suggestedItemIds = stockData
                .filter(item => item.dias_cobertura <= 60)
                .map(item => item.id);
            setRowSelectionModel({ type: 'include', ids: new Set(suggestedItemIds) });
        }
        setIsNewOrderVisible(true);
    }, [stockData, isNewOrderVisible]);

    const handleCloseNewOrder = useCallback(() => {
        setIsNewOrderVisible(false);
        setRowSelectionModel({ type: 'include', ids: new Set() });
        setNewOrderRows([]);
    }, []);

    const handleNewOrderRowUpdate = useCallback(async (newRow) => {
        setNewOrderRows(prevRows =>
            prevRows.map(row => (row.id === newRow.id ? newRow : row))
        );
        return newRow;
    }, []);

    const handleDeleteClick = (id) => {
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        setRowSelectionModel(prevModel => {
            const newIds = new Set(prevModel.ids);
            newIds.delete(itemToDelete);
            return { ...prevModel, ids: newIds };
        });
        setItemToDelete(null);
        setIsDeleteModalOpen(false);
    };

    const handleCreateOrder = (navigate) => {
        if (newOrderRows.length === 0) {
            alert("Por favor, adicione itens ao pedido.");
            return;
        }

        const timestamp = Date.now(); // Single timestamp for the whole order
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        const newOrderItems = newOrderRows.map((row, index) => ({
            id: timestamp + index, // Unique ID for each item row
            numero_pedido: `PED-${timestamp}`, // Shared order number
            item: row.item,
            fornecedor: row.fornecedor,
            quantidade: row.unidades,
            filial: row.filial,
            valor: row.valor,
            previsao_entrega: row.previsao_entrega,
            status: "Aprovado",
            data_entrega: null,
            data_pedido: formattedDate,
        }));

        navigate('/orders', { state: { newOrders: newOrderItems } });
    };

    return {
        isNewOrderVisible,
        newOrderRows,
        rowSelectionModel,
        setRowSelectionModel,
        filteredRows,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        fornecedor,
        setFornecedor,
        filial,
        setFilial,
        isDeleteModalOpen,
        setIsDeleteModalOpen,
        handleShowNewOrder,
        handleCloseNewOrder,
        handleNewOrderRowUpdate,
        handleDeleteClick,
        confirmDelete,
        handleCreateOrder
    };
};
