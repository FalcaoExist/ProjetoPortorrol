import Navbar from "../components/nav_bar/NavBar";
import Header from "../components/header/Header";
import { useAuth } from "../context/authContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
      <Navbar />
      <main className="min-w-0">
        <div className="flex flex-col">
          <Header pageTitle={"Dashboard"} userName={user?.name || "Usuário"} />

          <section className="xl:pr-48 pl-20 md:px-20 mt-3">
            <div className="border border-1 rounded-lg w-full  min-h-96"></div>
            <div className="w-full min-h-72 flex gap-2">
              <div className="w-1/5 grid grid-rows-3 grid-cols-2 gap-1 items-center">
                <p className="col-span-2">Pedidos</p>
                <div className="border border-1 rounded-xl p-12"></div>
                <div className="border border-1 rounded-xl p-12"></div>
                <div className="border border-1 rounded-xl p-12"></div>
                <div className="border border-1 rounded-xl p-12"></div>
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
