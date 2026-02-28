import React from "react";
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


export default function Home() {
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
    stockOverview,
    kpis, 
    STATUS_INDICATORS,
    skuOptions,
    orders, // ⬅️ Agora ele traz os números dinâmicos
    budget,
    leadtimeInfo,
    onSkuSearch
  } = useDashboardData();

  const { ordersData } = useOrders();


  const atrasadosCount = ordersData?.filter(o => o.status === "Atrasado").length || 0;
  const aprovadosCount = ordersData?.filter(o => o.status === "Aprovado").length || 0;
  
  // Exporta via serviço externo (single responsibility)
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
      budget,
      leadtimeInfo,
    });
  };
  // TODO: Implementar exportDashboardExcel e exportDashboardPDF
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
      budget,
      leadtimeInfo,
    });
  };

   const handleOrderClick = (status) => {
    const params = new URLSearchParams();
    params.set("status", status);
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
                  label={"Filial"} 
                  options={branchOptions} 
                  value={branch} 
                  onChange={setBranch} 
                  className="text-lg"
                />
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
              <CriticosChart branch={branch} supplier={supplier} data={dataCritic} />
              <div className="">
               <StockRangeGraph 
                    data={stockOverview ? stockOverview.data : STATUS_INDICATORS} 
                totalItems={stockOverview ? stockOverview.total : 0}
                branch={branch}
                supplier={supplier}
                />
              </div>
            </div>

            <div className="w-full flex gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-start font-semibold text-primary text-2xl py-5">Pedidos</p>
                <div className="flex gap-2 h-[128px]">
                  <Orders text={"Atrasados"} img={lateOrdersImg} number={8} onClick={() => handleOrderClick("Atrasado")}/>
                  <Orders text={"Aprovados"}  img={aprovedorders} number={8} onClick={() => handleOrderClick("Aprovado")}/>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-start font-semibold text-primary text-2xl py-5">Gastos</p>
                <div className="h-[128px] flex items-center">
                  <BudgetProgressCard
                    value={31452.32}
                    budget={88000}
                    startDate="01/10/2025"
                    endDate="01/11/2025"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-start font-bold text-primary text-2xl py-5">&nbsp;</p>
                <div className="h-[128px] flex items-center">
                  {/* [AQUI] Passando o dado real calculado */}
                  <LeadtimeSavingCard 
                    leadtime={kpis ? kpis.coverageDays : 0} 
                    saving={0} 
                  />
                </div>
              </div>
            </div>

            <div className="border border-1 rounded-lg w-full min-h-72 my-3">
              <div className="flex items-center gap-3 ml-6 mt-4 w-full pr-6">
                <SkuAutocomplete 
                    value={sku} 
                    onChange={(newVal) => setSku(newVal)} 
                    options={skuOptions} 
                    placeholder="Procurar SKU" 
                />
              </div>
              <MonthlyQuantityChart data={months} sku={sku?.value} />
            </div>

            <div className="border border-1 rounded-lg w-full min-h-72 mb-10">
              <div className="flex items-center gap-3 ml-6 mt-4">
                <Filter 
                  label={"Filial"} 
                  options={branchOptions} 
                  value={branch} 
                  onChange={setBranch}
                  className="text-lg" 
                />
                <Filter 
                  label={"Fornecedor"} 
                  options={supplierOptions} 
                  value={supplier} 
                  onChange={setSupplier}
                  className="text-lg" 
                />
              </div>
              <h2 className="ml-16 p-3 pb-0 text-[#464255] font-poppins font-bold text-lg">SKUs em excesso</h2>
              <OverstokChart branch={branch} supplier={supplier} data={data} />
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