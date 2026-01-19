import { useState, useMemo, useCallback, useEffect } from "react";
import { getStockData, createOrderBatch, getSuppliers } from "../services/stockService";

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
    // LÓGICA DE SINCRONIZAÇÃO (CORRIGIDA)
    // =========================================================
    
    useEffect(() => {
        // Pega os IDs selecionados na tabela principal (que agora são "ID-FILIAL")
        const selectionSet = (rowSelectionModel && rowSelectionModel.ids) 
            ? rowSelectionModel.ids 
            : new Set();

        setNewOrderRows(prevOrderRows => {
            // Filtra os itens do estoque reconstruindo o ID Composto para comparar
            const selectedRows = stockData
                .filter(row => {
                    // Recria o ID exatamente como a tabela StockTable faz
                    const compositeId = row.filial 
                        ? `${row.id}-${row.filial}` 
                        : String(row.id);
                    
                    // Verifica se esse ID composto está na lista de selecionados
                    return selectionSet.has(compositeId);
                })
                .map(item => {
                    // Gera o ID único para a tabela de baixo também
                    const uniqueRowId = item.filial ? `${item.id}-${item.filial}` : String(item.id);

                    // Verifica se já existia na tabela de baixo (para manter edições de preço/qtd)
                    const existingItem = prevOrderRows.find(nr => nr.id === uniqueRowId);
                    
                    if (existingItem) {
                        return existingItem;
                    }

                    // Se é novo, cria objeto.
                    // IMPORTANTE: Salvamos 'real_sku_id' para enviar ao backend depois
                    return {
                        ...item,
                        id: uniqueRowId,       // ID único para o React (DataGrid)
                        real_sku_id: item.id,  // ID numérico real para o Python
                        
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

        if (selectionSet.size > 0) {
            setIsNewOrderVisible(true);
        }
    }, [rowSelectionModel, stockData]);

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
    // HANDLERS
    // =========================================================

    const handleShowNewOrder = useCallback(() => {
        if (!isNewOrderVisible) {
            // Sugere itens críticos (precisamos usar o ID composto aqui também)
            const suggestedCompositeIds = stockData
                .filter(item => item.dias_cobertura <= 60)
                .map(item => item.filial ? `${item.id}-${item.filial}` : String(item.id));
            
            setRowSelectionModel({ type: 'include', ids: new Set(suggestedCompositeIds) });
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