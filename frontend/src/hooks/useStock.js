import { useState, useMemo, useCallback, useEffect } from "react";
import { getStockData, createOrderBatch, getSuppliers } from "../services/stockService";
import { getStockRowId } from "../utils/rowIds";

// Função auxiliar para definir status textual baseado nos dias
const getStatusText = (dias) => {
    if (dias <= 30) return "Ruptura iminente";
    if (dias <= 60) return "Subdimensionado";
    if (dias <= 100) return "Ok";
    return "Excesso";
};

export const useStock = () => {
    // --- 1. ESTADOS DE DADOS ---
    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [supplierOptions, setSupplierOptions] = useState([]); 

    // --- 2. ESTADOS DA TABELA DE REQUISIÇÃO (SELEÇÃO) ---
    const [rowSelectionModel, setRowSelectionModel] = useState({ type: 'include', ids: new Set() });
    const [newOrderRows, setNewOrderRows] = useState([]);
    const [isNewOrderVisible, setIsNewOrderVisible] = useState(false);

    // --- 3. FILTROS ---
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [fornecedor, setFornecedor] = useState("");
    const [filial, setFilial] = useState("");

    // --- 4. MODAIS ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // =========================================================
    // EFEITOS DE CARREGAMENTO (INIT)
    // =========================================================

    // A. Carrega Fornecedores
    useEffect(() => {
        const loadSuppliers = async () => {
            try {
                const suppliers = await getSuppliers();
                if (suppliers.length > 0) {
                    setSupplierOptions(suppliers);
                }
            } catch (error) {
                console.error("Falha ao carregar lista de fornecedores");
            }
        };
        loadSuppliers();
    }, []);

    // B. Carrega Estoque
    const fetchStock = useCallback(async (filters = {}) => {
        setLoading(true);
        try {
            const data = await getStockData(filters);
            setStockData(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erro ao carregar estoque:", error);
            setStockData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Recarrega estoque quando muda a filial (filtro de servidor)
    useEffect(() => {
        const activeFilters = {};
        if (filial) activeFilters.filial = filial;
        fetchStock(activeFilters);
    }, [fetchStock, filial]);

    // =========================================================
    // FILTRAGEM LOCAL
    // =========================================================
    
    const filteredRows = useMemo(() => {
        return stockData.filter(row => {
            const statusText = getStatusText(row.dias_cobertura);
            const searchLower = searchQuery.toLowerCase();
            
            const itemText = (row.item || "").toLowerCase();
            const codigoText = (row.codigo || "").toLowerCase();
            const rowFornecedor = row.fornecedor || "";
            const rowFilial = row.filial || "";

            return (
                (searchQuery === "" || itemText.includes(searchLower) || codigoText.includes(searchLower)) &&
                (statusFilter === "" || statusText === statusFilter) &&
                (fornecedor === "" || rowFornecedor === fornecedor) &&
                (filial === "" || rowFilial === filial)
            );
        });
    }, [stockData, searchQuery, statusFilter, fornecedor, filial]);

    // =========================================================
    // LÓGICA DE SINCRONIZAÇÃO 
    // =========================================================
    
    useEffect(() => {
        const ids = (rowSelectionModel && rowSelectionModel.ids instanceof Set)
            ? rowSelectionModel.ids
            : new Set();
        const type = rowSelectionModel?.type || 'include';

        const isRowSelected = (row) => {
            const id = getStockRowId(row);
            if (!id) return false;
            return type === 'exclude' ? !ids.has(id) : ids.has(id);
        };

       
        setNewOrderRows(prevOrderRows => {
            const selectedRows = filteredRows
                .filter(isRowSelected)
                .map(item => {
                    const uniqueRowId = getStockRowId(item);
                    const existingItem = prevOrderRows.find(nr => nr.id === uniqueRowId);
                    if (existingItem) return existingItem;

                    return {
                        ...item,
                        id: uniqueRowId,
                        real_sku_id: item.id,
                        unidades: item.unidades || 0,
                        valor: item.valor || 0,
                        quantidade: item.unidades > 0 ? Math.round(item.unidades * 0.5) : 100,
                        previsao_entrega: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        status: "Pendente",
                        fornecedor: item.fornecedor || ""
                    };
                });
            return selectedRows;
        });

        const selectedCount = type === 'exclude'
            ? Math.max(0, filteredRows.length - ids.size)
            : ids.size;
        if (selectedCount > 0) {
            setIsNewOrderVisible(true);
        }
    }, [rowSelectionModel, filteredRows]);

    // =========================================================
    // HANDLERS
    // =========================================================

    const handleShowNewOrder = useCallback(() => {
        setIsNewOrderVisible(true);
        setRowSelectionModel({ type: 'exclude', ids: new Set() });
        setNewOrderRows([]);
    }, []);

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
            const prevIds = (prevModel && prevModel.ids instanceof Set) ? prevModel.ids : new Set();
            const nextIds = new Set(prevIds);

           
            if (prevModel?.type === 'exclude') {
                nextIds.add(itemToDelete);
                return { type: 'exclude', ids: nextIds };
            }

            nextIds.delete(itemToDelete);
            return { type: 'include', ids: nextIds };
        });
        setItemToDelete(null);
        setIsDeleteModalOpen(false);
    };

    // --- FUNÇÃO FINAL: CRIAÇÃO DO PEDIDO ---
    const handleCreateOrder = async (navigate) => {
        if (newOrderRows.length === 0) {
            alert("Por favor, adicione itens ao pedido.");
            return;
        }

        try {
            // PREPARAÇÃO DOS DADOS:
            // O serviço espera { id: numero, ... }, mas nossos rows têm { id: "123-Filial" }
            // Vamos mapear de volta para o formato que o createOrderBatch espera.
            const itemsToSend = newOrderRows.map(row => ({
                ...row,
                id: row.real_sku_id || row.id // Usa o ID numérico salvo
            }));

            await createOrderBatch(itemsToSend);
            
            alert("Pedido criado com sucesso!");
            
            setRowSelectionModel({ type: 'include', ids: new Set() });
            setNewOrderRows([]);
            setIsNewOrderVisible(false);
            
            if (navigate) {
                navigate('/orders');
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao criar pedido. Verifique o console.");
        }
    };

    return {
        stockData,
        loading,
        supplierOptions,
        isNewOrderVisible,
        newOrderRows,
        rowSelectionModel,
        setRowSelectionModel,
        filteredRows,
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,
        fornecedor, setFornecedor,
        filial, setFilial,
        isDeleteModalOpen, setIsDeleteModalOpen,
        handleShowNewOrder,
        handleCloseNewOrder,
        handleNewOrderRowUpdate,
        handleDeleteClick,
        confirmDelete,
        handleCreateOrder
    };
};