import { useState, useEffect } from "react";
import dashboardService from "../services/dashboardService";
import * as supplierService from "../services/supplierService";
import { useAuth } from "../context/authContext";

const STATUS_INDICATORS = {
  RUPTURA: { color: "#e54c4c", label: "Ruptura" },
  SUBDIMENSIONADO: { color: "#f1c40f", label: "Subdimen." },
  OK: { color: "#e0e0e0", label: "Normal" },
  EXCESSO: { color: "#4a89f3", label: "Excesso" }
};

export default function useDashboardData() {
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
  
  const [stockOverview, setStockOverview] = useState({
    data: { ok: 0, excesso: 0, rupturaIminente: 0, subdimensionado: 0 },
    total: 0
  });

  const [kpis, setKpis] = useState({
    coverageDays: 0,
    savingPotential: 0 
  });

  // 1. CARGA INICIAL
  useEffect(() => {
    async function loadInitialData() {
      let autoSelectedSupplier = false;
      try {
        if (branchOptions.length === 0) {
            const filiais = (await dashboardService.getFiliais()) || [];
            const uniqueFiliais = Array.from(new Map(filiais.map(item => [item.nome, item])).values());
            const options = uniqueFiliais.map(f => ({ value: f.nome, label: f.nome }));
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
              if ((!supplier || supplier === "") && user && Array.isArray(user.supplier) && user.supplier.length > 0) {
                const first = user.supplier[0];
                const normalized = typeof first === 'string' ? first : (first?.name || first?.nome || "");
                if (normalized) {
                  setSupplier(normalized);
                  autoSelectedSupplier = true;
                }
              }
            } catch (e) {}
        }
        if (autoSelectedSupplier) return;

        const response = await dashboardService.getSkus(null, branch, supplier);
        const fetchedSkus = Array.isArray(response) ? response : [];
        setAllSkus(fetchedSkus); 

      } catch (error) {
        console.error("Erro dashboard:", error);
      }
    }
    loadInitialData();
  }, [branch, supplier, user]); 

  // 2. RECALCULAR GRÁFICOS E KPIs QUANDO SKU MUDAR
  useEffect(() => {
    if (!allSkus || allSkus.length === 0) return;

    const preencherOpcoes = allSkus.map(r => ({
        label: `${r.codigo} - ${r.nome_produto}`,
        value: r.sku_id || r.id,
        ...r
    }));
    setSkuOptions(preencherOpcoes);

    // A) Processamento dos Gráficos de Excesso e Ruptura (Gerais)
    const excessos = allSkus.filter(i => i.status === "EXCESSO");
    excessos.sort((a, b) => b.estoque_soma - a.estoque_soma); 
    setDataOverstock(excessos.map(item => ({
      name: item.codigo,
      qtd: item.estoque_soma,
      dias: item.atendimento,
      ...item
    })).slice(0, 15));

    const rupturas = allSkus.filter(i => i.status === "RUPTURA");
    rupturas.sort((a, b) => a.estoque_soma - b.estoque_soma); 
    setDataCritic(rupturas.map(item => ({
      name: item.codigo,
      qtd: item.estoque_soma, 
      demanda_real: item.demanda_soma,
      dias: item.atendimento,
      ...item
    })).slice(0, 15));

    const counts = { ok: 0, excesso: 0, rupturaIminente: 0, subdimensionado: 0 };
    allSkus.forEach(item => {
        const st = item.status; 
        if (st === 'OK') counts.ok++;
        else if (st === 'EXCESSO') counts.excesso++;
        else if (st === 'RUPTURA') counts.rupturaIminente++;
        else if (st === 'SUBDIMENSIONADO') counts.subdimensionado++;
    });
    setStockOverview({ data: counts, total: allSkus.length });

    // B) LÓGICA DO KPI DE COBERTURA (ESTRITAMENTE INDIVIDUAL)
    if (sku) {
        // Busca o item exato pelo ID para pegar os dias de cobertura
        const targetId = sku.value || sku.sku_id || sku.id;
        const skuDetails = allSkus.find(item => item.sku_id === targetId || item.id === targetId) || sku;
        
        const atendimento = skuDetails.atendimento || 0;
        setKpis({ coverageDays: Math.round(atendimento), savingPotential: 0 });
    } else {
        // ZERA o KPI se nenhum SKU estiver selecionado na barra de pesquisa
        setKpis({ coverageDays: 0, savingPotential: 0 });
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
        console.error("Erro na busca:", error);
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
        console.error("Erro ao carregar histórico:", error);
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
    months: monthsData,
    data: dataOverstock,
    dataCritic: dataCritic,
    stockOverview, 
    kpis, 
    STATUS_INDICATORS,
    onSkuSearch
  };
}