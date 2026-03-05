import React, { useEffect, useMemo, useRef } from "react";
import LeadtimeSavingCard from "../components/charts/LeadtimeSavingCard";
import Navbar from "../components/nav_bar/NavBar";
import Header from "../components/header/Header";
import { useAuth } from "../context/authContext";
import CriticosChart from "../components/charts/CriticsChart";
import StockRangeGraph from "../components/charts/StockRangeGraph";
import Filter from "../components/common/Filter";
import Orders from "../components/charts/Orders";
import lateOrdersImg from "../assets/lateorders.png";
import aprovedorders from "../assets/aprovedorders.png";
import BudgetProgressCard from "../components/charts/BudgetProgressCard";
import MonthlyQuantityChart from "../components/charts/MonthlyQuantityChart";
import OverstokChart from "../components/charts/OverstokChart";
import SkuAutocomplete from "../components/common/SKUAutocomplete";
import useDashboardData from "../hooks/useDashboardData";
import { exportDashboardCSV } from "../services/csvExporter";
import xlsxExporter from "../services/xlsxExporter";
import ExportDropdown from "../components/common/ExportDropdown";
import { useOrders } from "../hooks/useOrders";
import { useNavigate } from "react-router-dom";

// ---> ADICIONADO: Função isolada para formatar datas da tabela <---
const formatDate = (dateString) => {
  if (!dateString) return "--/--/----";
  const d = new Date(dateString);
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
  return d.toLocaleDateString('pt-BR');
};

const normalizeText = (value) => {
  if (!value) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

export default function Home() {
  const AUTO_SKU_INTERVAL_MS = 7000;
  const USER_IDLE_RESUME_MS = 300000;

  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    branch, setBranch,
    supplier, setSupplier,
    sku, setSku,
    branchOptions,
    supplierOptions,
    months, 
    data,
    dataCritic,
    loading,
    stockOverview,
    kpis, 
    STATUS_INDICATORS,
    skuOptions,
    orders, 
    leadtimeInfo,
    onSkuSearch,
    budgetInfo,          
    totalSuggestedValue  
  } = useDashboardData();

  const { ordersData, loading: ordersLoading } = useOrders();
  const lastSkuInteractionAtRef = useRef(0);

  const filteredOrdersData = useMemo(() => {
    const selectedSupplier = normalizeText(supplier);
    const shouldFilterBySupplier = selectedSupplier !== "" && selectedSupplier !== "todos";

    if (!shouldFilterBySupplier) {
      return ordersData || [];
    }

    return (ordersData || []).filter((order) => {
      const orderSupplier = normalizeText(order?.fornecedor);
      return orderSupplier.includes(selectedSupplier);
    });
  }, [ordersData, supplier]);

  const atrasadosCount = filteredOrdersData.filter(o => o.status === "Atrasado").length;
  const aprovadosCount = filteredOrdersData.filter(o => o.status === "Aprovado").length;
  
  const handleExportCSV = () => {
    exportDashboardCSV({
      branch,
      supplier,
      sku,
      months,
      data,
      dataCritic,
      statusIndicators: stockOverview?.data || {},
      orders,
      budget: budgetInfo?.valor, 
      leadtimeInfo,
    });
  };

  const handleExportExcel = () => {
    xlsxExporter.exportDashboardXLSX({
      branch,
      supplier,
      sku,
      months,
      data,
      dataCritic,
      statusIndicators: stockOverview?.data || {},
      orders,
      budget: budgetInfo?.valor,
      leadtimeInfo,
    });
  };

  useEffect(() => {
    if (!Array.isArray(skuOptions) || skuOptions.length === 0) return;

    const intervalId = setInterval(() => {
      const userIsActive = Date.now() - lastSkuInteractionAtRef.current < USER_IDLE_RESUME_MS;
      if (userIsActive) return;

      setSku((currentSku) => {
        if (!currentSku?.value) {
          return skuOptions[0];
        }

        const currentIndex = skuOptions.findIndex((option) => option?.value === currentSku.value);
        const nextIndex = currentIndex >= 0
          ? (currentIndex + 1) % skuOptions.length
          : 0;

        return skuOptions[nextIndex];
      });
    }, AUTO_SKU_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [skuOptions, setSku]);

  const handleSkuChange = (newVal) => {
    lastSkuInteractionAtRef.current = Date.now();
    setSku(newVal);
  };

  const handleSkuUserInteraction = () => {
    lastSkuInteractionAtRef.current = Date.now();
  };

   const handleOrderClick = (status) => {
    const params = new URLSearchParams();
    params.set("status", status);
    if (supplier) params.set("fornecedor", supplier);
    navigate(`/orders?${params.toString()}`);
  };

  return (
    <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
      <Navbar />
      <main className="min-w-0">
        <div className="flex flex-col">
          <Header pageTitle={"Dashboard"} userName={user?.name || "Usuário"} />

          <section className="pl-20 md:px-12 mt-3">
            <div className="flex gap-5 my-5">
                <Filter
                  label={"Fornecedor"}
                  options={supplierOptions}
                  value={supplier} 
                  onChange={setSupplier}
                  className="text-lg"
                />
            </div>
            
            <div className="border border-1 rounded-lg w-full min-h-96">
              <h2 className="ml-16 p-3 pb-0 text-[#464255] font-poppins font-bold text-lg">SKUs mais Críticos</h2>
              <CriticosChart
                branch={branch}
                supplier={supplier}
                data={dataCritic}
                loading={loading}
                emptyMessage="Não foram encontrados SKUs críticos para esse fornecedor."
              />
              <div className="">
               <StockRangeGraph 
                    data={stockOverview ? stockOverview.data : STATUS_INDICATORS} 
                totalItems={stockOverview ? stockOverview.total : 0}
                branch={branch}
                supplier={supplier}
                loading={loading}
                />
              </div>
            </div>

            <div className="w-full flex gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-start font-semibold text-primary text-2xl py-5">Pedidos</p>
                <div className="flex gap-2 h-[128px]">
                  <Orders text={"Atrasados"} img={lateOrdersImg} number={atrasadosCount} loading={ordersLoading} onClick={() => handleOrderClick("Atrasado")}/>
                  <Orders text={"Aprovados"}  img={aprovedorders} number={aprovadosCount} loading={ordersLoading} onClick={() => handleOrderClick("Aprovado")}/>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-start font-semibold text-primary text-2xl py-5">Gastos</p>
                <div className="h-[128px] flex items-center">
                  {/* ---> ADICIONADO: Props conectadas aos dados do banco <--- */}
                  <BudgetProgressCard
                    value={budgetInfo ? Number(budgetInfo.valor_individual) : 0} 
                    budget={budgetInfo ? Number(budgetInfo.valor_total) : 0}     
                    startDate={formatDate(budgetInfo?.start)}
                    endDate={formatDate(budgetInfo?.end)}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-start font-bold text-primary text-2xl py-5">&nbsp;</p>
                <div className="h-[128px] flex items-center">
                  <LeadtimeSavingCard supplier={supplier} />
                </div>
              </div>
            </div>

            <div className="border border-1 rounded-lg w-full min-h-72 my-3">
              <div className="flex items-center gap-3 ml-6 mt-4 w-full pr-6">
                <SkuAutocomplete 
                    value={sku} 
                  onChange={handleSkuChange} 
                    options={skuOptions} 
                    placeholder="Procurar SKU" 
                />
              </div>
              <MonthlyQuantityChart
                data={months}
                sku={sku?.value}
                onUserInteraction={handleSkuUserInteraction}
              />
            </div>

            <div className="border border-1 rounded-lg w-full min-h-72 mb-10">
              <div className="flex items-center gap-3 ml-6 mt-4">
                <Filter 
                  label={"Fornecedor"} 
                  options={supplierOptions} 
                  value={supplier} 
                  onChange={setSupplier}
                  className="text-lg" 
                />
              </div>
              <h2 className="ml-16 p-3 pb-0 text-[#464255] font-poppins font-bold text-lg">SKUs em excesso</h2>
              <OverstokChart
                branch={branch}
                supplier={supplier}
                data={data}
                loading={loading}
                emptyMessage="Não foram encontrados SKUs em excesso para esse fornecedor."
              />
            </div>

            <div className="flex justify-end mb-24">
             <ExportDropdown
                options={[ 
                  { label: "CSV", onClick: handleExportCSV },
                  { label: "Excel", onClick: handleExportExcel },
                ]}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}