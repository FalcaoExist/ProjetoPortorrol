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
  const [branch, setBranch] = useState("");
  const [supplier, setSupplier] = useState(() => getPersistedSupplierFilter());
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
    coverageDays: 0
  });

  // 1. CARGA INICIAL
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

        // Skus
        const response = await dashboardService.getSkus(null, branch, supplier);
        const fetchedSkus = Array.isArray(response) ? response : [];
        setAllSkus(fetchedSkus); 

        // Itens criticos
        const criticalItems = await dashboardService.getCriticalItems(20, supplier);
        const mappedCritical = criticalItems.map(item => ({
             name: item.codigo,
             qtd: item.estoque_atual,
             dias: item.dias_cobertura,
             demanda_real: item.demanda_mensal_media,
             ...item
        }));
        setDataCritic(mappedCritical);

        // Itens em excesso
        const excessItems = await dashboardService.getExcessItems(20, supplier);
        const mappedExcess = excessItems.map(item => ({
             name: item.codigo,
             qtd: item.dias_cobertura, 
             dias: item.dias_cobertura,
             stock: item.estoque_atual,
             ...item
        }));
        setDataOverstock(mappedExcess);

        
        // BUSCA DADOS AGREGADOS PARA PREENCHER O STOCK RANGE GRAPH
        const statusResponse = await dashboardService.getSupplierStatus(branch, supplier);
        if (Array.isArray(statusResponse)) {
           let acc = { excesso: 0, rupturaIminente: 0, subdimensionado: 0, ok: 0 };
           let totalAcc = 0;

           statusResponse.forEach(item => {
               acc.excesso += Number(item.qtd_excesso || item.excesso || item.EXCESSO || 0);
               acc.rupturaIminente += Number(item.qtd_ruptura || item.ruptura || item.RUPTURA || 0); 
               acc.subdimensionado += Number(item.qtd_subdimensionado || item.subdimensionado || item.SUBDIMENSIONADO || 0);
               acc.ok += Number(item.qtd_ok || item.ok || item.OK || item.normal || 0);
           });
           
           totalAcc = acc.excesso + acc.rupturaIminente + acc.subdimensionado + acc.ok;
           setStockOverview({ data: acc, total: totalAcc });
        }

        // =========================================================
        // BUSCA STATUS DE PEDIDOS (ORDERS)
        // =========================================================
       

      } catch (error) {
        logger.error("Erro dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [branch, supplier, user]); 

  useEffect(() => {
    setPersistedSupplierFilter(supplier);
  }, [supplier]);

  // 2. RECALCULAR GRÁFICOS E KPIs QUANDO SKU MUDAR
  useEffect(() => {
    if (!allSkus || allSkus.length === 0) return;

    const preencherOpcoes = allSkus.map(r => ({
        label: `${r.codigo} - ${r.nome_produto}`,
        value: r.sku_id || r.id,
        ...r
    }));
    setSkuOptions(preencherOpcoes);

  
    if (sku) {
        const targetId = sku.value || sku.sku_id || sku.id;
        const skuDetails = allSkus.find(item => item.sku_id === targetId || item.id === targetId) || sku;
        
        const atendimento = skuDetails.atendimento || 0;
        setKpis({ coverageDays: Math.round(atendimento) });
    } else {
        setKpis({ coverageDays: 0 });
    }
  }, [allSkus, sku]);

  // 3. Busca de SKU no Input
  const onSkuSearch = async (query) => {
    if (!query || query.length < 1) return; 
    try {
        const results = await dashboardService.searchSkus(query);
        const options = results.map(r => ({ 
          label: `${r.codigo} - ${r.nome_produto}`, 
          value: r.sku_id || r.id, 
          ...r 
        }));
        setSkuOptions(options);
    } catch (error) {
      logger.error("Erro na busca:", error);
    }
  };

  // 4. Carregar Histórico do Gráfico de Linha (SOMENTE INDIVIDUAL)
  useEffect(() => {
    async function loadHistory() {
      // Se não tem SKU selecionado, esvazia o gráfico (não busca soma de nada)
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
    onSkuSearch
  };
}