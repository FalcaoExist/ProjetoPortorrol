import { useState } from "react";

export default function useDashboardData() {
  const [branch, setBranch] = useState("Todos");
  const [supplier, setSupplier] = useState("Todos");
  const [sku, setSku] = useState(null);

  const branchOptions = [
    { value: "Todos", label: "Todos" },
    { value: "filial", label: "Filial" },
    { value: "filial_a", label: "Filial A" },
    { value: "filial_b", label: "Filial B" },
  ];

  const supplierOptions = [
    { value: "Todos", label: "Todos" },
    { value: "fornecedor", label: "Fornecedor" },
    { value: "fornecedor_x", label: "Fornecedor X" },
    { value: "fornecedor_y", label: "Fornecedor Y" },
  ];

  const months = [
    { month: "Jan/24", value: 220 },
    { month: "Fev/24", value: 370 },
    { month: "Mar/24", value: 400 },
    { month: "Abr/24", value: 350 },
    { month: "Mai/24", value: 330 },
    { month: "Jun/24", value: 420 },
    { month: "Jul/24", value: 600 },
    { month: "Ago/24", value: 700 },
    { month: "Set/24", value: 800 },
    { month: "Out/24", value: 650 },
    { month: "Nov/24", value: 752 },
    { month: "Dez/24", value: 500 },
    { month: "Jan/25", value: 300 },
    { month: "Fev/25", value: 410 },
    { month: "Mar/25", value: 420 },
    { month: "Abr/25", value: 390 },
    { month: "Mai/25", value: 350 },
    { month: "Jun/25", value: 480 },
    { month: "Jul/25", value: 700 },
    { month: "Ago/25", value: 820 },
    { month: "Set/25", value: 870 },
    { month: "Out/25", value: 690 },
    { month: "Nov/25", value: 752 },
    { month: "Dez/25", value: 510 },
  ];

  const data = [
    { name: 'Page A', qtd: 120 },
    { name: 'Page B', qtd: 250 },
    { name: 'Page C', qtd: 320 },
    { name: 'Page D', qtd: 350 },
    { name: 'Page E', qtd: 350 },
    { name: 'Page F', qtd: 350 },
    { name: 'Page G', qtd: 400 },
    { name: 'Page M', qtd: 520 },
    { name: 'Page H', qtd: 410 },
    { name: 'Page L', qtd: 500 },
    { name: 'Page I', qtd: 420 },
    { name: 'Page J', qtd: 440 },
    { name: 'Page K', qtd: 480 },
    { name: 'Page T', qtd: 700 },
    { name: 'Page N', qtd: 520 },
    { name: 'Page O', qtd: 550 },
    { name: 'Page P', qtd: 580 },
    { name: 'Page Q', qtd: 600 },
    { name: 'Page R', qtd: 630 },
    { name: 'Page S', qtd: 660 },
  ];

  const dataCritic = [
    { name: 'Page A', qtd: 12 },
    { name: 'Page B', qtd: 25 },
    { name: 'Page C', qtd: 32 },
    { name: 'Page D', qtd: 35 },
    { name: 'Page E', qtd: 35 },
    { name: 'Page F', qtd: 35 },
    { name: 'Page G', qtd: 40 },
    { name: 'Page M', qtd: 52 },
    { name: 'Page H', qtd: 41 },
    { name: 'Page L', qtd: 50 },
    { name: 'Page I', qtd: 42 },
    { name: 'Page J', qtd: 44 },
    { name: 'Page K', qtd: 48 },
    { name: 'Page T', qtd: 70 },
    { name: 'Page N', qtd: 52 },
    { name: 'Page O', qtd: 55 },
    { name: 'Page P', qtd: 58 },
    { name: 'Page Q', qtd: 60 },
    { name: 'Page R', qtd: 63 },
    { name: 'Page S', qtd: 66 },
  ];

  const STATUS_INDICATORS = {
    excesso: 18,
    rupturaIminente: 32,
    subdimensionado: 25,
    ok: 55,
  };

  // Dados de pedidos, gastos e leadtime/saving — colocados no hook para serem dinâmicos
  const orders = [
    { text: "Atrasados", number: 8 },
    { text: "Aprovados", number: 8 },
  ];

  const budget = {
    value: 31452.32,
    budget: 88000,
    startDate: "01/10/2025",
    endDate: "01/11/2025",
  };

  const leadtimeInfo = { leadtime: 15, saving: 8 };

  const skuOptions = Array.from(
    new Set([...data.map((d) => d.name), ...dataCritic.map((d) => d.name)])
  ).map((name) => ({ label: name, value: name }));

  return {
    branch,
    setBranch,
    supplier,
    setSupplier,
    sku,
    setSku,
    branchOptions,
    supplierOptions,
    months,
    data,
    dataCritic,
    STATUS_INDICATORS,
    orders,
    budget,
    leadtimeInfo,
    skuOptions,
  };
}
