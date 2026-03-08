import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import ordersService from "../services/ordersService";
import { getSuppliers } from "../services/stockService";
import { logger } from "../utils/logger";
import { useAuth } from "../context/authContext";
import { getPersistedSupplierFilter, setPersistedSupplierFilter } from "../utils/supplierFilterPersistence";

const removeAcentos = (str) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

export function useOrders() {
    const { user } = useAuth();
    const hasAutoAppliedSupplier = useRef(false);
    const hasInitializedSupplierFromStorage = useRef(false);
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
    const [fornecedorFilter, setFornecedorFilter] = useState("");
    const [supplierOptions, setSupplierOptions] = useState([]);

    useEffect(() => {
        if (hasInitializedSupplierFromStorage.current) return;
        if (!user?.id) return;

        const persistedSupplier = getPersistedSupplierFilter(user.id);
        if (persistedSupplier) {
            setFornecedorFilter(persistedSupplier);
        }

        hasInitializedSupplierFromStorage.current = true;
    }, [user]);

    useEffect(() => {
        const loadSuppliers = async () => {
            try {
                const suppliers = await getSuppliers();
                if (Array.isArray(suppliers)) {
                    setSupplierOptions(suppliers);
                } else {
                    setSupplierOptions([]);
                }
            } catch (err) {
                logger.error('Erro ao carregar fornecedores:', err);
                setSupplierOptions([]);
            }
        };
        loadSuppliers();
    }, []);

    useEffect(() => {
        if (!fornecedorFilter) return;
        if (!Array.isArray(supplierOptions) || supplierOptions.length === 0) return;
        if (!supplierOptions.includes(fornecedorFilter)) {
            setFornecedorFilter("");
        }
    }, [fornecedorFilter, supplierOptions]);

    useEffect(() => {
        if (hasAutoAppliedSupplier.current) return;
        if (fornecedorFilter && String(fornecedorFilter).trim() !== "") return;
        if (!user || !Array.isArray(user.supplier) || user.supplier.length === 0) return;

        const first = user.supplier[0];
        const normalized = typeof first === "string" ? first : (first?.name || first?.nome || "");

        if (normalized) {
            setFornecedorFilter(normalized);
            hasAutoAppliedSupplier.current = true;
        }
    }, [user, fornecedorFilter]);

    useEffect(() => {
        if (!user?.id) return;
        setPersistedSupplierFilter(fornecedorFilter, user.id);
    }, [fornecedorFilter, user]);

    useEffect(() => {
        try {
            const params = new URLSearchParams(location.search || "");
            const statusParam = params.get("status") || "";
            setStatusFilter(statusParam);
        } catch (err) {
            logger.error('Erro ao ler query params:', err);
        }
    }, [location.search]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ordersService.getAll();
            setOrdersData(Array.isArray(data) ? data : []);
        } catch (error) {
            logger.error("Erro busca:", error);
            setOrdersData([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const handleUpdateData = async (rowId, field, value) => {
        const snapshot = Array.isArray(ordersData) ? ordersData : [];

        setOrdersData((previous) =>
            ordersService.applyFieldUpdateLocally(previous, rowId, field, value)
        );

        try {
            await ordersService.persistFieldUpdate(snapshot, rowId, field, value);
        } catch (err) {
            logger.error("ERRO AO SALVAR NA API:", err);
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

            if (item.status === "Atrasado") {
                acc[k].status = "Atrasado";
            } else if (item.status === "Finalizado" && acc[k].status !== "Atrasado") {
                acc[k].status = "Finalizado";
            }
            
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

            let fText = fornecedorFilter;
            if (fText && typeof fText === 'object' && fText.target) fText = fText.target.value;
            const f = removeAcentos(String(fText || "").trim());
            
            const matchItemName = o.items.some(childItem => 
                childItem.item && removeAcentos(String(childItem.item)).includes(s)
            );

            const matchSearch = s === "" || 
                 removeAcentos(String(o.numero_pedido)).includes(s) || 
                 removeAcentos(String(o.fornecedor)).includes(s) ||
                 removeAcentos(String(o.item)).includes(s) || 
                 matchItemName;

            const matchResponsavel = r === "" || removeAcentos(String(o.responsavel)).includes(r);

            const matchFornecedor = f === "" || removeAcentos(String(o.fornecedor || "")).includes(f);

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
                matchFornecedor &&
                matchDate &&
                (statusFilter === "" || statusFilter === "Todos" || o.status === statusFilter)
            );
        });
    }, [ordersData, searchQuery, responsavelFilter, statusFilter, orderDate, fornecedorFilter]);

    return {
        ordersData, loading, 
        searchQuery, setSearchQuery, 
        responsavelFilter, setResponsavelFilter, 
        statusFilter, setStatusFilter, 
        orderDate, setOrderDate,
        modalOpen, selectedOrderItems, handleOpenModal, handleCloseModal: () => setModalOpen(false),
        groupedAndFilteredOrders, handleUpdateData, fornecedorFilter, setFornecedorFilter,
        supplierOptions,
        fetchOrders,
    };
}