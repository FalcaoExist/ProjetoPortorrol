import { useState, useEffect, useRef } from "react";
import dashboardService from "../services/dashboardService";
import * as supplierService from "../services/supplierService";
import { logger } from "../utils/logger";
import { useAuth } from "../context/authContext";
import { getPersistedSupplierFilter, setPersistedSupplierFilter } from "../utils/supplierFilterPersistence";

const STATUS_INDICATORS = {
  RUPTURA: { color: "#e54c4c", label: "Ruptura" },
  SUBDIMENSIONADO: { color: "#f1c40f", label: "Subdimen." },
  OK: { color: "#e0e0e0", label: "Normal" },
  EXCESSO: { color: "#4a89f3", label: "Excesso" }
};

export default function useDashboardData() {
  const hasAutoAppliedSupplier = useRef(false);
  const hasInitializedSupplierFromStorage = useRef(false);
  
  const [branch, setBranch] = useState("");
  const [supplier, setSupplier] = useState("");
  const [sku, setSku] = useState(null);

  const [branchOptions, setBranchOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [skuOptions, setSkuOptions] = useState([]);
  const { user } = useAuth();

  const [allSkus, setAllSkus] = useState([]); 
  const [dataOverstock, setDataOverstock] = useState([]);
  const [dataCritic, setDataCritic] = useState([]);
  const [monthsData, setMonthsData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [stockOverview, setStockOverview] = useState({
    data: { ok: 0, excesso: 0, rupturaIminente: 0, subdimensionado: 0 },
    total: 0
  });

  const [orders, setOrders] = useState({ approved: 0, late: 0 });

  const [kpis, setKpis] = useState({
    coverageDays: 0,
    savingPotential: 0 
  });

  const [budgetInfo, setBudgetInfo] = useState({ 
    valor_total: 0, 
    valor_individual: 0, 
    start: null, 
    end: null 
  });
  const [totalSuggestedValue, setTotalSuggestedValue] = useState(0);

  // 1. INICIALIZAÇÃO DE FILTRO
  useEffect(() => {
    if (hasInitializedSupplierFromStorage.current) return;
    if (!user?.id) return;

    const persistedSupplier = getPersistedSupplierFilter(user.id);
    if (persistedSupplier) {
      setSupplier(persistedSupplier);
    }
    hasInitializedSupplierFromStorage.current = true;
  }, [user]);

  // 2. CARGA INICIAL DE OPÇÕES E DADOS
  useEffect(() => {
    async function loadInitialData() {
      let autoSelectedSupplier = false;
      setLoading(true);
      try {
        if (branchOptions.length === 0) {
            const filiais = (await dashboardService.getFiliais()) || [];
            const uniqueNomes = [...new Set(filiais.map(item => item.nome))];
            const options = uniqueNomes.map(nome => ({ value: nome, label: nome }));
            options.unshift({ value: "", label: "Todas" });
            setBranchOptions(options);
        }

        if (supplierOptions.length === 0) {
            const fornecedores = (await supplierService.getSuppliers()) || [];          
            const nomesUnicos = [...new Set(fornecedores.map(s => {
                if (typeof s === 'string') return s;
                return s?.name || s?.nome;
            }))].filter(Boolean).sort();

            const optionsSuppliers = nomesUnicos.map(nome => ({ value: nome, label: nome }));
            optionsSuppliers.unshift({ value: "", label: "Todos" });
            setSupplierOptions(optionsSuppliers);

            if (supplier && !optionsSuppliers.some(option => option.value === supplier)) {
              setSupplier("");
            }

            try {
              if (!hasAutoAppliedSupplier.current) {
                if ((!supplier || supplier === "") && user?.supplier?.length > 0) {
                  const first = user.supplier[0];
                  const normalized = typeof first === 'string' ? first : (first?.name || first?.nome || "");
                  if (normalized) {
                    setSupplier(normalized);
                    hasAutoAppliedSupplier.current = true;
                    autoSelectedSupplier = true;
                  }
                }
              }
            } catch (e) {}
        }
        
        if (autoSelectedSupplier) return;

        // Skus
        const response = await dashboardService.getSkus(null, branch, supplier);
        setAllSkus(Array.isArray(response) ? response : []); 

        // Itens criticos
        const criticalItems = await dashboardService.getCriticalItems(20, supplier);
        setDataCritic(criticalItems.map(item => ({
             name: item.codigo,
             qtd: item.dias_cobertura,
             demanda_real: item.demanda_mensal_media,
             ...item
        })));

        // Itens em excesso
        const excessItems = await dashboardService.getExcessItems(20, supplier);
        setDataOverstock(excessItems.map(item => ({
             name: item.codigo,
             qtd: item.dias_cobertura, 
             dias: item.dias_cobertura,
             stock: item.estoque_atual,
             ...item
        })));

        // Visão Geral do Estoque
        const statusResponse = await dashboardService.getSupplierStatus(branch, supplier);
        if (Array.isArray(statusResponse)) {
           let acc = { excesso: 0, rupturaIminente: 0, subdimensionado: 0, ok: 0 };
           statusResponse.forEach(item => {
               acc.excesso += Number(item.qtd_excesso || item.excesso || item.EXCESSO || 0);
               acc.rupturaIminente += Number(item.qtd_ruptura || item.ruptura || item.RUPTURA || 0); 
               acc.subdimensionado += Number(item.qtd_subdimensionado || item.subdimensionado || item.SUBDIMENSIONADO || 0);
               acc.ok += Number(item.qtd_ok || item.ok || item.OK || item.normal || 0);
           });
           setStockOverview({ data: acc, total: acc.excesso + acc.rupturaIminente + acc.subdimensionado + acc.ok });
        }

      } catch (error) {
        logger.error("Erro dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [branch, supplier, user]); 

  // 3. BUSCA DE ORÇAMENTO (BUDGET)
  useEffect(() => {
    async function fetchBudget() {
        try {
            // "Todos" garante que o backend some os orçamentos globais
            const info = await dashboardService.getSupplierBudget(supplier || "Todos");
            
            // Garantia contra campos undefined para evitar NaN no frontend
            setBudgetInfo({
              valor_total: info?.valor_total ?? 0,
              valor_individual: info?.valor_individual ?? 0,
              start: info?.start || null,
              end: info?.end || null
            });
        } catch (error) {
            logger.error("Erro ao carregar budget:", error);
            setBudgetInfo({ valor_total: 0, valor_individual: 0, start: null, end: null });
        }
    }
    
    fetchBudget();
    
    if (user?.id) {
        setPersistedSupplierFilter(supplier, user.id);
    }
  }, [supplier, user]);

  // 4. PROCESSAMENTO DE SKUs E KPIs
  useEffect(() => {
    if (!allSkus || allSkus.length === 0) {
      setTotalSuggestedValue(0);
      return;
    }

    setSkuOptions(allSkus.map(r => ({
        label: `${r.nome_produto} - ${r.codigo}`,
        value: r.sku_id || r.id,
        ...r
    })));

    const totalCusto = allSkus.reduce((acc, item) => {
        const qtdSugerida = Number(item.sugestao_compra) || 0;
        const preco = Number(item.valor) || 0;
        return acc + (qtdSugerida * preco);
    }, 0);
    setTotalSuggestedValue(totalCusto);

    if (sku) {
        const targetId = sku.value || sku.sku_id || sku.id;
        const skuDetails = allSkus.find(item => item.sku_id === targetId || item.id === targetId) || sku;
        setKpis({ 
            coverageDays: Math.round(skuDetails.atendimento || 0),
            savingPotential: skuDetails.savingPotential || 0 
        });
    }
  }, [allSkus, sku]);

  // 5. BUSCA DE SKU E HISTÓRICO
  const onSkuSearch = async (query) => {
    if (!query || query.length < 1) return; 
    try {
        const results = await dashboardService.searchSkus(query);
        setSkuOptions(results.map(r => ({ 
          label: `${r.nome_produto} - ${r.codigo}`, 
          value: r.sku_id || r.id, 
          ...r 
        })));
    } catch (error) {
      logger.error("Erro na busca:", error);
    }
  };

  useEffect(() => {
    async function loadHistory() {
      if (!sku) {
        setMonthsData([]);
        return;
      }
      try {
        const id = sku.value || sku.sku_id || sku.id;
        const history = await dashboardService.getHistory(id);
        setMonthsData(history || []);
      } catch (error) {
        logger.error("Erro ao carregar histórico:", error);
        setMonthsData([]); 
      }
    }
    loadHistory();
  }, [sku]);

  return {
    branch, setBranch,
    supplier, setSupplier,
    sku, setSku,
    branchOptions,
    supplierOptions,
    skuOptions,
    orders,
    months: monthsData,
    data: dataOverstock,
    dataCritic: dataCritic,
    loading,
    stockOverview, 
    kpis, 
    STATUS_INDICATORS,
    onSkuSearch,
    budgetInfo,           
    totalSuggestedValue  
  };
}