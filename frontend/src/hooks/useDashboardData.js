import { useState, useEffect } from "react";
import dashboardService from "../services/dashboardService";
// CORREÇÃO 1: 'import * as' permite usar supplierService.getSuppliers()
import * as supplierService from "../services/supplierService";

// Configuração Central de Cores e Labels
const STATUS_INDICATORS = {
  RUPTURA: { color: "#e54c4c", label: "Ruptura" },          // Vermelho (< 30 dias)
  SUBDIMENSIONADO: { color: "#f1c40f", label: "Subdimen." },  // Amarelo (30-60 dias)
  OK: { color: "#e0e0e0", label: "Normal" },                  // Cinza (60-120 dias)
  EXCESSO: { color: "#4a89f3", label: "Excesso" }             // Azul (> 120 dias)
};

export default function useDashboardData() {
  // Filtros
  const [branch, setBranch] = useState("");
  const [supplier, setSupplier] = useState("");
  const [sku, setSku] = useState(null);

  // Opções para Selects
  const [branchOptions, setBranchOptions] = useState([]);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [skuOptions, setSkuOptions] = useState([]);

  // Dados dos Gráficos
  const [dataOverstock, setDataOverstock] = useState([]);
  const [dataCritic, setDataCritic] = useState([]);
  const [monthsData, setMonthsData] = useState([]);
  
  // Pizza (Estoque Geral)
  const [stockOverview, setStockOverview] = useState({
    data: { ok: 0, excesso: 0, rupturaIminente: 0, subdimensionado: 0 },
    total: 0
  });

  // KPIs
  const [kpis, setKpis] = useState({
    coverageDays: 0,
    savingPotential: 0 
  });

  // Carga Inicial e Filtros
  useEffect(() => {
    async function loadInitialData() {
      try {
        // 1. Carregar Opções de Filtros (se vazio)
        if (branchOptions.length === 0) {
            const filiais = (await dashboardService.getFiliais()) || [];
            const uniqueFiliais = Array.from(new Map(filiais.map(item => [item.nome, item])).values());
            const options = uniqueFiliais.map(f => ({ value: f.nome, label: f.nome }));
            options.unshift({ value: "", label: "Todas" });
            setBranchOptions(options);
        }

        if (supplierOptions.length === 0) {
            // CORREÇÃO 2: Chamada direta para getSuppliers
            const fornecedores = (await supplierService.getSuppliers()) || [];
            
            // CORREÇÃO 3: Tratamento híbrido (String ou Objeto)
            // Se o backend retornar ["Timken", "NSK"], usamos 's' direto.
            // Se retornar [{name: "Timken"}], usamos 's.name'.
            const nomesUnicos = [...new Set(fornecedores.map(s => {
                if (typeof s === 'string') return s;
                return s?.name || s?.nome; // Tenta name ou nome
            }))].filter(Boolean).sort();

            const optionsSuppliers = nomesUnicos.map(nome => ({ value: nome, label: nome }));
            optionsSuppliers.unshift({ value: "", label: "Todos" });
            setSupplierOptions(optionsSuppliers);
        }

        // 2. Buscar Dados Principais
        const response = await dashboardService.getSkus(null, branch, supplier);
        const allSkus = Array.isArray(response) ? response : [];

        // --- PROCESSAMENTO DOS DADOS ---

        // A) Gráfico de Excesso (Azul)
        const excessos = allSkus.filter(i => i.status === "EXCESSO");
        excessos.sort((a, b) => b.estoque_soma - a.estoque_soma);
        
        setDataOverstock(excessos.map(item => ({
          name: item.codigo,
          qtd: item.estoque_soma, 
          dias: item.atendimento,
          ...item
        })).slice(0, 15));

        // B) Gráfico de Críticos (Ruptura)
        const rupturas = allSkus.filter(i => i.status === "RUPTURA");
        rupturas.sort((a, b) => a.estoque_soma - b.estoque_soma);

        setDataCritic(rupturas.map(item => ({
          name: item.codigo,
          qtd: item.demanda_soma, 
          estoque_real: item.estoque_soma,
          dias: item.atendimento,
          ...item
        })).slice(0, 15));

        // C) Gráfico de Pizza (Contagem Geral)
        const counts = { ok: 0, excesso: 0, rupturaIminente: 0, subdimensionado: 0 };
        allSkus.forEach(item => {
            const st = item.status; 
            if (st === 'OK') counts.ok++;
            else if (st === 'EXCESSO') counts.excesso++;
            else if (st === 'RUPTURA') counts.rupturaIminente++;
            else if (st === 'SUBDIMENSIONADO') counts.subdimensionado++;
        });
        setStockOverview({ data: counts, total: allSkus.length });

        // D) KPI: Dias de Cobertura Geral
        const totalEstoque = allSkus.reduce((acc, item) => acc + Number(item.estoque_soma || 0), 0);
        const totalDemanda = allSkus.reduce((acc, item) => acc + Number(item.demanda_soma || 0), 0);
        
        let diasCobertura = 0;
        if (totalDemanda > 0) {
            diasCobertura = Math.round((totalEstoque / totalDemanda) * 30);
        } else if (totalEstoque > 0) {
            diasCobertura = 9999; 
        }

        setKpis({ coverageDays: diasCobertura, savingPotential: 0 });

      } catch (error) {
        console.error("Erro dashboard:", error);
      }
    }
    loadInitialData();
  }, [branch, supplier]); 

  // Busca de SKU
  const onSkuSearch = async (query) => {
    if (!query || query.length < 1) return; 
    
    try {
        const results = await dashboardService.searchSkus(query);
        const options = results.map(r => ({ 
          label: `${r.codigo} - ${r.nome_produto}`, 
          value: r.id, 
          ...r 
        }));
        setSkuOptions(options);
    } catch (error) {
        console.error("Erro na busca:", error);
    }
  };

  // Carregar Histórico
  useEffect(() => {
    async function loadHistory() {
      try {
        const id = sku && sku.value ? sku.value : null;
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