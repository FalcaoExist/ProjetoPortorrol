import { useState, useMemo, useCallback, useEffect } from "react";
import { getStockData, createOrderBatch, getSuppliers } from "../services/stockService";
import { logger } from "../utils/logger";
import { useAuth } from "../context/authContext";
import { getPersistedSupplierFilter, setPersistedSupplierFilter } from "../utils/supplierFilterPersistence";

// Função auxiliar para definir status textual baseado nos dias de cobertura
const getStatusText = (dias) => {
    if (dias === null || dias === undefined) return "Sem demanda";
    if (dias <= 30) return "Ruptura iminente";
    if (dias <= 60) return "Subdimensionado";
    if (dias <= 100) return "Ok";
    return "Excesso";
};

export const useStock = () => {
    const { user } = useAuth();
    // --- 1. ESTADOS DE DADOS ---
    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [supplierOptions, setSupplierOptions] = useState([]); 

    // --- 2. ESTADOS DA TABELA DE REQUISIÇÃO (SELEÇÃO) ---
    // Mantemos o formato de Objeto + Set exigido pelo seu DataGrid atual
    const [rowSelectionModel, setRowSelectionModel] = useState({ type: 'include', ids: new Set() });
    
    const [newOrderRows, setNewOrderRows] = useState([]);
    const [isNewOrderVisible, setIsNewOrderVisible] = useState(false);

    // --- 3. FILTROS ---
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [fornecedor, setFornecedor] = useState(() => getPersistedSupplierFilter());
    const [filial, setFilial] = useState("");

    // --- 4. MODAIS E UTILITÁRIOS ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isImportConfirmModalOpen, setIsImportConfirmModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // EFEITOS DE CARREGAMENTO (INIT)
    // Carrega a lista de fornecedores para os filtros
    useEffect(() => {
        const loadSuppliers = async () => {
            try {
                const suppliers = await getSuppliers();
                if (suppliers.length > 0) {
                    setSupplierOptions(suppliers);
                }
            } catch (error) {
                logger.error("Falha ao carregar lista de fornecedores", error);
            }
        };
        loadSuppliers();
    }, []);

    useEffect(() => {
        if (fornecedor && String(fornecedor).trim() !== "") return;
        if (!user || !Array.isArray(user.supplier) || user.supplier.length === 0) return;

        const first = user.supplier[0];
        const normalized = typeof first === "string" ? first : (first?.name || first?.nome || "");

        if (normalized) {
            setFornecedor(normalized);
        }
    }, [user, fornecedor]);

    useEffect(() => {
        setPersistedSupplierFilter(fornecedor);
    }, [fornecedor]);

    // Carrega dados do estoque aplicando filtros de servidor
    const fetchStock = useCallback(async (filters = {}) => {
        setLoading(true);
        try {
            const data = await getStockData(filters);
            setStockData(Array.isArray(data) ? data : []);
        } catch (error) {
            logger.error("Erro ao carregar estoque:", error);
            setStockData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const activeFilters = {};
        if (filial) activeFilters.filial = filial;
        if (fornecedor) activeFilters.fornecedor = fornecedor;
        fetchStock(activeFilters);
    }, [fetchStock, filial, fornecedor]);

    // LÓGICA DE SINCRONIZAÇÃO (Seleção -> Tabela de Pedido)
    
    useEffect(() => {
        const selectionSet = (rowSelectionModel && rowSelectionModel.ids) 
            ? rowSelectionModel.ids 
            : new Set();

        setNewOrderRows(prevOrderRows => {
            const selectedRows = stockData
                .filter(row => selectionSet.has(row.id)) // Filtra pelo ID único gerado no service
                .map(item => {
                    // mapStockToFrontend retorna real_sku_id, não sku_id na raiz
                    const existingItem = prevOrderRows.find(nr => nr.real_sku_id === item.real_sku_id);
                    
                    if (existingItem) return existingItem;

                    // Cria novo item para a tabela de pedido com valores padrão
                    // item.quantidade deve vir de qtd_sugerida se existir e for > 0
                    const qtdSugerida = item.qtd_sugerida > 0 ? item.qtd_sugerida : 0;
                    
                    return {
                        ...item,
                        real_sku_id: item.real_sku_id, 
                        unidades: item.qtd_sugerida !== undefined ? item.qtd_sugerida : 0,
                        quantidade: item.qtd_sugerida !== undefined ? item.qtd_sugerida : 0,
                        // Setada para o leadtime vindo do back
                        previsao_entrega: new Date(Date.now() + (item.leadtime || 15) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        status: "Pendente"
                    };
                });
            return selectedRows;
        });

        if (selectionSet.size > 0) {
            setIsNewOrderVisible(true);
        }
    }, [rowSelectionModel, stockData]);

    // FILTRAGEM LOCAL
    
    const filteredRows = useMemo(() => {
        return stockData.filter(row => {
            const statusText = getStatusText(row.dias_cobertura);
            const searchLower = searchQuery.toLowerCase();
            const itemText = (row.item || "").toLowerCase();
            const codigoText = (row.codigo || "").toLowerCase();

            return (
                (searchQuery === "" || itemText.includes(searchLower) || codigoText.includes(searchLower)) &&
                (statusFilter === "" || statusText === statusFilter) &&
                (fornecedor === "" || row.fornecedor === fornecedor) &&
                (filial === "" || row.filial === filial)
            );
        });
    }, [stockData, searchQuery, statusFilter, fornecedor, filial]);

    // HANDLERS
    const handleShowNewOrder = useCallback(() => {
        if (!isNewOrderVisible) {
            const skusAbaixoDoROP = stockData.filter(row => {
                // Excluir itens "Sem demanda" (dias_cobertura null ou undefined)
                if (row.dias_cobertura === null || row.dias_cobertura === undefined) return false;
                // Se a sugestão de compra for 0,
                // não faz sentido selecionar automaticamente.
                // Então condição: rop > 0 e qtd_sugerida > 0.
                const rop = parseFloat(row.rop) || 0;
                const unidades = parseFloat(row.unidades) || 0;
                const sugerida = parseFloat(row.qtd_sugerida) || 0;
                
                return (unidades <= rop) && (sugerida > 0);
            });
            
            if (skusAbaixoDoROP.length > 0) {
                const newIds = new Set(skusAbaixoDoROP.map(row => row.id));
                setRowSelectionModel({ type: 'include', ids: newIds });
            }
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

    // --- CRIAÇÃO DO PEDIDO (LIMPEZA E ENVIO) ---
    const handleCreateOrder = async (navigate) => {
        if (newOrderRows.length === 0) {
            return { success: false, message: "Nenhum item na requisição." };
        }

        try {
            const itemsList = newOrderRows.map((row) => ({
                sku_id: parseInt(row.real_sku_id, 10), 
                quantity: parseInt(row.quantidade, 10),
                unit_cost: parseFloat(row.valor || 0),
                supplier_name: row.fornecedor || "Não informado",
                expected_delivery_date: row.previsao_entrega || null
            }));

            await createOrderBatch(itemsList); 
            
            handleCloseNewOrder();
            if (navigate) navigate('/orders'); 
            return { success: true, message: 'Pedido criado com sucesso.' };
            
        } catch (error) {
            const msg = error.response?.data?.detail || error.message;
            logger.error(`Erro ao criar pedido: ${msg}`);
            return { success: false, message: 'Erro ao criar pedido.' };
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
        isImportConfirmModalOpen, setIsImportConfirmModalOpen,
        selectedFile, setSelectedFile,
        handleShowNewOrder,
        handleCloseNewOrder,
        handleNewOrderRowUpdate,
        handleDeleteClick,
        confirmDelete,
        handleCreateOrder,
        fetchStock
    };
};