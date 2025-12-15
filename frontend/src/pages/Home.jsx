import React, { useState } from "react";
import Navbar from "../components/nav_bar/NavBar";
import Header from "../components/header/Header";
import { useAuth } from "../context/authContext";
import CriticosChart from "../components/charts/CriticosChart";
import StockRangeGraph from "../components/charts/StockRangeGraph";
import Filter from "../components/common/Filter";
import LateOrders from "../components/charts/LateOrders";
import lateOrdersImg from "../assets/lateorders.png";


export default function Home() {
  const { user } = useAuth();
  const [branch, setBranch] = useState("filial");
  const [supplier, setSupplier] = useState("fornecedor");

  const branchOptions = [
    { value: "filial", label: "Filial" },
    { value: "filial_a", label: "Filial A" },
    { value: "filial_b", label: "Filial B" },
  ];

  const supplierOptions = [
    { value: "fornecedor", label: "Fornecedor" },
    { value: "fornecedor_x", label: "Fornecedor X" },
    { value: "fornecedor_y", label: "Fornecedor Y" },
  ];

  return (
    <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
      <Navbar />
      <main className="min-w-0">
        <div className="flex flex-col">
          <Header pageTitle={"Dashboard"} userName={user?.name || "Usuário"} />

          <section className="xl:pr-48 pl-20 md:px-20 mt-3">
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
              <CriticosChart branch={branch} supplier={supplier} />
              <div className="">
                <StockRangeGraph />
              </div>
            </div>
            <div className="w-full min-h-72 flex gap-2">
              <div className="w-1/5 grid grid-rows-3 grid-cols-2 gap-1 items-center">
                <p className="col-span-2">Pedidos</p>
                <LateOrders img={lateOrdersImg} number={8} />
                <LateOrders img={lateOrdersImg} number={8} />

              </div>
              <div className="w-3/5 grid grid-rows-3 grid-cols-2 gap-1 items-center">
                <p className="col-span-2">Gastos</p>
                <div className="border border-1 rounded-lg h-full col-span-2 row-span-2"></div>
              </div>
              <div className="grow grid grid-rows-3 grid-cols-2 gap-1 items-center">
                <p className="col-span-2"></p>
                <div className="border border-1 rounded-lg h-full col-span-2 row-span-2"></div>
              </div>
            </div>
            <div className="border border-1 rounded-lg w-full  min-h-72 my-3"></div>
            <div className="border border-1 rounded-lg w-full  min-h-72 mb-10"></div>
            <div className="flex justify-end">
              <button>Exportar</button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
