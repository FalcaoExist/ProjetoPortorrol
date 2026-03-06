import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { getStockData, createOrderBatch, getSuppliers } from "../services/stockService";
import { logger } from "../utils/logger";
import { useAuth } from "../context/authContext";
import { getPersistedSupplierFilter, setPersistedSupplierFilter } from "../utils/supplierFilterPersistence";

const BRANCH_OPTIONS = ["Porto Alegre", "Joinville", "São Paulo"];

const getStatusText = (dias) => {
    if (dias === null || dias === undefined) return "Sem demanda";
    if (dias <= 30) return "Ruptura iminente";
    if (dias <= 60) return "Subdimensionado";
    if (dias <= 100) return "Ok";
    return "Excesso";
};

const getSuggestedQuantity = (row) => {
    const unidadesPendentes = parseFloat(row?.unidades_pendentes) || 0;
    const sugeridaProjetada = parseFloat(row?.quantidade_sugerida_compra_projetada) || 0;
    const sugeridaPadrao = parseFloat(row?.qtd_sugerida) || 0;

    return unidadesPendentes > 0 ? sugeridaProjetada : sugeridaPadrao;
};

export const useStock = () => {
    const { user } = useAuth();
    const hasAutoAppliedSupplier = useRef(false);
    const hasInitializedSupplierFromStorage = useRef(false);

    const [stockData, setStockData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [supplierOptions, setSupplierOptions] = useState([]); 

    const [rowSelectionModel, setRowSelectionModel] = useState({ type: 'include', ids: new Set() });
    const [newOrderRows, setNewOrderRows] = useState([]);
    const [isNewOrderVisible, setIsNewOrderVisible] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [fornecedor, setFornecedor] = useState("");
    const [filial, setFilial] = useState("");

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isImportConfirmModalOpen, setIsImportConfirmModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // EFEITOS DE CARREGAMENTO (INIT)
    // Carrega a lista de fornecedores para os filtros
    useEffect(() => {
        if (hasInitializedSupplierFromStorage.current) return;
        if (!user?.id) return;

        const persistedSupplier = getPersistedSupplierFilter(user.id);
        if (persistedSupplier) {
            setFornecedor(persistedSupplier);
        }

        hasInitializedSupplierFromStorage.current = true;
    }, [user]);

    useEffect(() => {
        const loadSuppliers = async () => {
            try {
                const suppliers = await getSuppliers();
                if (suppliers.length > 0) setSupplierOptions(suppliers);
            } catch (error) {
                logger.error("Falha ao carregar lista de fornecedores", error);
            }
        };
        loadSuppliers();
    }, []);

    useEffect(() => {
        if (!fornecedor || !Array.isArray(supplierOptions) || supplierOptions.length === 0) return;
        if (!supplierOptions.includes(fornecedor)) setFornecedor("");
    }, [fornecedor, supplierOptions]);

    useEffect(() => {
        if (hasAutoAppliedSupplier.current) return;
        if (fornecedor && String(fornecedor).trim() !== "") return;
        if (!user?.supplier?.length) return;
        const first = user.supplier[0];
        const normalized = typeof first === "string" ? first : (first?.name || first?.nome || "");
        if (normalized) {
            setFornecedor(normalized);
            hasAutoAppliedSupplier.current = true;
        }
    }, [user, fornecedor]);

    useEffect(() => {
        if (user?.id) setPersistedSupplierFilter(fornecedor, user.id);
    }, [fornecedor, user]);

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

    useEffect(() => {
        const selectionSet = rowSelectionModel?.ids || new Set();

        setNewOrderRows(prevOrderRows => {
            return stockData
                .filter(row => selectionSet.has(row.id))
                .map(item => {
                    const existingItem = prevOrderRows.find(nr => nr.real_sku_id === item.real_sku_id);
                    if (existingItem) return existingItem;

                    const qtdSugerida = getSuggestedQuantity(item);
                    
                    return {
                        ...item,
                        real_sku_id: item.real_sku_id || item.sku_id || item.id,
                        unidades: qtdSugerida > 0 ? qtdSugerida : 0,
                        quantidade: qtdSugerida > 0 ? qtdSugerida : 0,
                        filial: item.filial || "",
                        // Setada para o leadtime vindo do back
                        previsao_entrega: new Date(Date.now() + (item.leadtime || 15) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        status: "Pendente"
                    };
                });
        });

        if (selectionSet.size > 0) setIsNewOrderVisible(true);
    }, [rowSelectionModel, stockData]);

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

    const handleShowNewOrder = useCallback(() => {
        if (!isNewOrderVisible) {
            const skusAbaixoDoROP = filteredRows.filter(row => {
                if (row.dias_cobertura === null || row.dias_cobertura === undefined) return false;
                const rop = parseFloat(row.rop) || 0;
                const unidades = parseFloat(row.unidades) || 0;
                const sugerida = getSuggestedQuantity(row);
                return (unidades <= rop) && (sugerida > 0);
            });
            
            if (skusAbaixoDoROP.length > 0) {
                const newIds = new Set(skusAbaixoDoROP.map(row => row.id));
                setRowSelectionModel({ type: 'include', ids: newIds });
            }
        }
        setIsNewOrderVisible(true);
    }, [filteredRows, isNewOrderVisible]);

    const handleCloseNewOrder = useCallback(() => {
        setIsNewOrderVisible(false);
        setRowSelectionModel({ type: 'include', ids: new Set() });
        setNewOrderRows([]);
    }, []);

    const handleNewOrderRowUpdate = useCallback(async (newRow) => {
        setNewOrderRows(prevRows => prevRows.map(row => (row.id === newRow.id ? newRow : row)));
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

    const handleCreateOrder = async (navigate) => {
        if (newOrderRows.length === 0) return { success: false, message: "Nenhum item na requisição." };

        const hasInvalidBranch = newOrderRows.some((row) => !BRANCH_OPTIONS.includes(row?.filial));
        if (hasInvalidBranch) {
            logger.warn("Pedido bloqueado: existe item sem filial válida.");
            return {
                success: false,
                message: "Todos os itens devem ter uma filial válida (Porto Alegre, Joinville ou São Paulo)."
            };
        }

        try {
            const itemsList = newOrderRows.map((row) => {
                const qtd = parseInt(row.unidades || row.quantidade || 1, 10);
                return {
                    sku_id: parseInt(row.real_sku_id, 10),
                    quantity: qtd,
                    unit_cost: parseFloat(row.valor || 0) / qtd,
                    supplier_name: row.fornecedor || "Não informado",
                    branch_name: row.filial,
                    expected_delivery_date: row.previsao_entrega || null
                };
            });

            await createOrderBatch(itemsList);
            handleCloseNewOrder();
            if (navigate) navigate('/orders'); 
            return { success: true, message: 'Pedido criado com sucesso.' };
        } catch (error) {
            logger.error(`Erro ao criar pedido: ${error.message}`);
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