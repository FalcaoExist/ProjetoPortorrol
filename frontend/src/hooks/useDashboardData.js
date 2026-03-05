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
    savingPotential: 0 // Mantido da Feature
  });

  // Novos estados financeiros da branch FEATURE
  const [budgetInfo, setBudgetInfo] = useState({ valor_total: 0, valor_individual: 0, start: null, end: null });
  const [totalSuggestedValue, setTotalSuggestedValue] = useState(0);

  // 1. INICIALIZAÇÃO DE FILTRO (Recuperado da DEV)
  useEffect(() => {
    if (hasInitializedSupplierFromStorage.current) return;
    if (!user?.id) return;

    const persistedSupplier = getPersistedSupplierFilter(user.id);
    if (persistedSupplier) {
      setSupplier(persistedSupplier);
    }
    hasInitializedSupplierFromStorage.current = true;
  }, [user]);

  // 2. CARGA INICIAL DE OPÇÕES E SKUs
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

            // Seleção automática por perfil de usuário
            try {
              if (hasAutoAppliedSupplier.current) return;
              if ((!supplier || supplier === "") && user && Array.isArray(user.supplier) && user.supplier.length > 0) {
                const first = user.supplier[0];
                const normalized = typeof first === 'string' ? first : (first?.name || first?.nome || "");
                if (normalized) {
                  setSupplier(normalized);
                  hasAutoAppliedSupplier.current = true;
                  autoSelectedSupplier = true;
                }
              }
            } catch (e) {}
        }
        
        if (autoSelectedSupplier) return;

        // Busca SKUs (Lógica base da Feature: processar as listas depois via efeito)
        const response = await dashboardService.getSkus(null, branch, supplier);
        setAllSkus(Array.isArray(response) ? response : []); 

      } catch (error) {
        logger.error("Erro dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [branch, supplier, user]); 

  // 3. BUSCA ORÇAMENTO E PERSISTÊNCIA (União das branches)
  useEffect(() => {
    async function fetchBudget() {
        try {
            // Se supplier for "", o service deve chamar a rota sem o parâmetro, 
            // resultando na soma de todos os orçamentos no back.
            const info = await dashboardService.getSupplierBudget(supplier || "Todos");
            setBudgetInfo(info || { valor_total: 0, valor_individual: 0, start: null, end: null });
        } catch (error) {
            logger.error("Erro ao carregar budget:", error);
        }
    }
    
    // Removido o if(supplier) para permitir que carregue o total geral por padrão
    fetchBudget();
    
    if (user?.id) {
        setPersistedSupplierFilter(supplier, user.id);
    }
  }, [supplier, user]);

  // 4. RECALCULAR GRÁFICOS, KPIs E FINANCEIRO (Lógica Otimizada da FEATURE)
  useEffect(() => {
    if (!allSkus || allSkus.length === 0) {
      setTotalSuggestedValue(0);
      return;
    }

    // Preencher opções do seletor de SKU
    setSkuOptions(allSkus.map(r => ({
        label: `${r.nome_produto} - ${r.codigo}`,
        value: r.sku_id || r.id,
        ...r
    })));

    // Cálculo do custo total sugerido
    const totalCusto = allSkus.reduce((acc, item) => {
        const qtdSugerida = item.sugestao_compra || 0;
        const preco = item.valor || 0;
        return acc + (qtdSugerida * preco);
    }, 0);
    setTotalSuggestedValue(totalCusto);

    // Processamento de Listas (Excesso e Ruptura) filtrando allSkus
    const excessos = allSkus.filter(i => i.status === "EXCESSO");
    excessos.sort((a, b) => (b.estoque_soma || 0) - (a.estoque_soma || 0)); 
    setDataOverstock(excessos.map(item => ({
      name: item.codigo,
      qtd: item.estoque_soma,
      dias: item.atendimento,
      ...item
    })).slice(0, 20));

    const rupturas = allSkus.filter(i => i.status === "RUPTURA" || i.status === "RUPTURA_IMINENTE");
    rupturas.sort((a, b) => (a.estoque_soma || 0) - (b.estoque_soma || 0)); 
    setDataCritic(rupturas.map(item => ({
      name: item.codigo,
      qtd: item.estoque_soma, 
      demanda_real: item.demanda_soma,
      dias: item.atendimento,
      ...item
    })).slice(0, 20));

    // Contador do Gráfico de Visão Geral
    const counts = { ok: 0, excesso: 0, rupturaIminente: 0, subdimensionado: 0 };
    allSkus.forEach(item => {
        const st = item.status; 
        if (st === 'OK') counts.ok++;
        else if (st === 'EXCESSO') counts.excesso++;
        else if (st === 'RUPTURA' || st === 'RUPTURA_IMINENTE') counts.rupturaIminente++;
        else if (st === 'SUBDIMENSIONADO') counts.subdimensionado++;
    });
    setStockOverview({ data: counts, total: allSkus.length });

    // KPI de Cobertura Individual
    if (sku) {
        const targetId = sku.value || sku.sku_id || sku.id;
        const skuDetails = allSkus.find(item => item.sku_id === targetId || item.id === targetId) || sku;
        setKpis({ 
            coverageDays: Math.round(skuDetails.atendimento || 0),
            savingPotential: skuDetails.savingPotential || 0 
        });
    } else {
        setKpis({ coverageDays: 0, savingPotential: 0 });
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