import { useState, useEffect, useCallback } from "react";
import dashboardService from "../services/dashboardService";
import supplierService from "../services/supplierService";

const STATUS_INDICATORS = {
  RUPTURA: { color: "#e54c4c", label: "Ruptura" },
  SUBDIMENSIONADO: { color: "#f1c40f", label: "Subdimensionado" },
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

  useEffect(() => {
    async function loadInitialData() {
      try {
        if (branchOptions.length === 0) {
            const filiais = (await dashboardService.getFiliais()) || [];
            const uniqueFiliais = Array.from(new Map(filiais.map(item => [item.nome, item])).values());
            const options = uniqueFiliais.map(f => ({ value: f.nome, label: f.nome }));
            options.unshift({ value: "", label: "Todas" });
            setBranchOptions(options);
        }

        if (supplierOptions.length === 0) {
            const fornecedores = (await supplierService.getAll()) || [];
            const nomesUnicos = [...new Set(fornecedores.map(s => s.name))].filter(Boolean).sort();
            const optionsSuppliers = nomesUnicos.map(nome => ({ value: nome, label: nome }));
            optionsSuppliers.unshift({ value: "", label: "Todos" });
            setSupplierOptions(optionsSuppliers);
        }

        const response = await dashboardService.getSkus(null, branch, supplier);
        const allSkus = Array.isArray(response) ? response : [];

        // --- CÁLCULOS ---

        // 1. Gráficos
        const excessos = allSkus.filter(i => i.status === "EXCESSO");
        const rupturas = allSkus.filter(i => i.status === "RUPTURA");

        setDataOverstock(excessos.map(item => ({
          name: item.codigo,
          qtd: item.estoque_soma, 
          ...item
        })).slice(0, 15));

        setDataCritic(rupturas.map(item => ({
          name: item.codigo,
          qtd: item.demanda_soma,
          ...item
        })).slice(0, 15));

        // 2. Pizza
        const counts = { ok: 0, excesso: 0, rupturaIminente: 0, subdimensionado: 0 };
        allSkus.forEach(item => {
            const st = item.status;
            if (st === 'OK') counts.ok++;
            else if (st === 'EXCESSO') counts.excesso++;
            else if (st === 'RUPTURA') counts.rupturaIminente++;
            else if (st === 'SUBDIMENSIONADO') counts.subdimensionado++;
        });
        setStockOverview({ data: counts, total: allSkus.length });

        // 3. KPI: Dias de Cobertura (Blindado com Number())
        const totalEstoque = allSkus.reduce((acc, item) => acc + Number(item.estoque_soma || 0), 0);
        const totalDemanda = allSkus.reduce((acc, item) => acc + Number(item.demanda_soma || 0), 0);
        
        let diasCobertura = 0;
        
        // Evita divisão por zero
        if (totalDemanda > 0) {
            // Fórmula: (Estoque Total / Demanda Total Mensal) * 30 dias
            diasCobertura = Math.round((totalEstoque / totalDemanda) * 30);
        } else if (totalEstoque > 0) {
            // Se tem estoque mas demanda é 0, a cobertura é "infinita" (ou 999)
            diasCobertura = 999; 
        }

        setKpis({
            coverageDays: diasCobertura,
            savingPotential: 0 
        });

      } catch (error) {
        console.error("Erro dashboard:", error);
      }
    }
    loadInitialData();
  }, [branch, supplier]); 

  const onSkuSearch = async (query) => {
    if (!query || query.length < 3) return;
    const results = await dashboardService.searchSkus(query);
    setSkuOptions(results.map(r => ({ 
      label: `${r.codigo} - ${r.nome_produto}`, 
      value: r.sku_id, 
      ...r 
    })));
  };

  useEffect(() => {
    async function loadHistory() {
      if (sku && sku.value) {
        const history = await dashboardService.getHistory(sku.value);
        setMonthsData(history);
      } else {
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