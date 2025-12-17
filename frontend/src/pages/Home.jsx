import React, { useState } from "react";
import LeadtimeSavingCard from "../components/charts/LeadtimeSavingCard";
import Navbar from "../components/nav_bar/NavBar";
import Header from "../components/header/Header";
import { useAuth } from "../context/authContext";
import CriticosChart from "../components/charts/CriticosChart";
import StockRangeGraph from "../components/charts/StockRangeGraph";
import Filter from "../components/common/Filter";
import Orders from "../components/charts/Orders";
import lateOrdersImg from "../assets/lateorders.png";
import aprovedorders from "../assets/aprovedorders.png";
import BudgetProgressCard from "../components/charts/BudgetProgressCard";
import MonthlyQuantityChart from "../components/charts/MonthlyQuantityChart";
import OverstokChart from "../components/charts/OverstokChart";


export default function Home() {
  const { user } = useAuth();
  const [branch, setBranch] = useState("filial");
  const [supplier, setSupplier] = useState("fornecedor");

  // Filial para o filtro
  const branchOptions = [
    { value: "filial", label: "Filial" },
    { value: "filial_a", label: "Filial A" },
    { value: "filial_b", label: "Filial B" },
  ];

  // Fornecedor para o filtro
  const supplierOptions = [
    { value: "fornecedor", label: "Fornecedor" },
    { value: "fornecedor_x", label: "Fornecedor X" },
    { value: "fornecedor_y", label: "Fornecedor Y" },
  ];

  // Meses e valores para o grafico de linha
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

  // skus
  // Estou usando os mesmos dados mockados para os criticos e em excesso
  // Na integração isso deve ser mudado
  const data = [
    { name: 'Page A', qtd: 120, },
    { name: 'Page B', qtd: 250, },
    { name: 'Page C', qtd: 320, },
    { name: 'Page D', qtd: 350, },
    { name: 'Page E', qtd: 350, },
    { name: 'Page F', qtd: 350, },
    { name: 'Page G', qtd: 400, },
    { name: 'Page M', qtd: 520, },
    { name: 'Page H', qtd: 410, },
    { name: 'Page L', qtd: 500, },
    { name: 'Page I', qtd: 420, },
    { name: 'Page J', qtd: 440, },
    { name: 'Page K', qtd: 480, },
    { name: 'Page T', qtd: 700, },
    { name: 'Page N', qtd: 520, },
    { name: 'Page O', qtd: 550, },
    { name: 'Page P', qtd: 580, },
    { name: 'Page Q', qtd: 600, },
    { name: 'Page R', qtd: 630, },
    { name: 'Page S', qtd: 660, },
];

const dataCritic = [
    { name: 'Page A', qtd: 12, },
    { name: 'Page B', qtd: 25, },
    { name: 'Page C', qtd: 32, },
    { name: 'Page D', qtd: 35, },
    { name: 'Page E', qtd: 35, },
    { name: 'Page F', qtd: 35, },
    { name: 'Page G', qtd: 40, },
    { name: 'Page M', qtd: 52, },
    { name: 'Page H', qtd: 41, },
    { name: 'Page L', qtd: 50, },
    { name: 'Page I', qtd: 42, },
    { name: 'Page J', qtd: 44, },
    { name: 'Page K', qtd: 48, },
    { name: 'Page T', qtd: 70, },
    { name: 'Page N', qtd: 52, },
    { name: 'Page O', qtd: 55, },
    { name: 'Page P', qtd: 58, },
    { name: 'Page Q', qtd: 60, },
    { name: 'Page R', qtd: 63, },
    { name: 'Page S', qtd: 66, },
];
// Percentual de skus nos indicadores
const STATUS_INDICATORS = {
  excesso: 18,
  rupturaIminente: 32,
  subdimensionado: 25,
  ok: 55, 
};

  return (
    <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
      <Navbar />
      <main className="min-w-0">
        <div className="flex flex-col">
          <Header pageTitle={"Dashboard"} userName={user?.name || "Usuário"} />

          <section className="pl-20 md:px-20 mt-3">
            <div className="border border-1 rounded-lg w-full  min-h-96">
              <div className="flex items-center gap-3 ml-6 mt-4">
                <Filter
                  label={"Filial"}
                  options={branchOptions}
                  value={branch}
                  onChange={setBranch}
                />
                <Filter
                  label={"Fornecedor"}
                  options={supplierOptions}
                  value={supplier}
                  onChange={setSupplier}
                />
              </div>
              <h2 className="ml-16 p-3 pb-0 text-[#464255] font-poppins font-bold text-lg">SKUs mais Críticos</h2>
              <CriticosChart branch={branch} supplier={supplier} data={dataCritic} />
              <div className="">
                <StockRangeGraph data={STATUS_INDICATORS}/>
              </div>
            </div>
            <div className="w-full flex gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-start font-semibold text-primary text-xl py-5">Pedidos</p>
                <div className="flex gap-2 h-[128px]">
                  <Orders text={"Atrasados"} img={lateOrdersImg} number={8} />
                  <Orders text={"Aprovados"} img={aprovedorders} number={8} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-start font-semibold text-primary text-xl py-5">Gastos</p>
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
                <p className="text-start font-bold text-primary text-xl py-5">&nbsp;</p>
                <div className="h-[128px] flex items-center">
                  <LeadtimeSavingCard leadtime={15} saving={8} />
                </div>
              </div>
            </div>
            <div className="border border-1 rounded-lg w-full  min-h-72 my-3">

              <MonthlyQuantityChart data={months}/>
            </div>
            <div className="border border-1 rounded-lg w-full  min-h-72 mb-10">
              <div className="flex items-center gap-3 ml-6 mt-4">
                <Filter
                  label={"Filial"}
                  options={branchOptions}
                  value={branch}
                  onChange={setBranch}
                />
                <Filter
                  label={"Fornecedor"}
                  options={supplierOptions}
                  value={supplier}
                  onChange={setSupplier}
                />
              </div>
              <h2 className="ml-16 p-3 pb-0 text-[#464255] font-poppins font-bold text-lg">SKUs em excesso</h2>
              <OverstokChart branch={branch} supplier={supplier} data={data}/>
            </div>
            <div className="flex justify-end">
              <button>Exportar</button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
