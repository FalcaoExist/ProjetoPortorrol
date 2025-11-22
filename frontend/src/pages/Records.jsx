import { useState } from "react";
import Navbar from "../components/nav_bar/NavBar";
import Header from "../components/header/Header";
import UserFilter from "../components/user_filter/UserFilter";

const DEFAULT_USERS = [
    {
        id: 1,
        name: "Ana Beatriz",
    },
    {
        id: 2,
        name: "Carlos Alberto",
    },
];

export default function Records({ users = DEFAULT_USERS }) {
    // Caso alguma página redirecione para essa com algum usuário já selecionado
    // Aqui está selecionado o primeiro para placeholder
    const [selectedUser, setSelectedUser] = useState(() => users[1] ?? null);

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />
            <main className="min-w-0 flex flex-col">
                <Header pageTitle={"Registros"} userName={"Dionatas"} />
                {/* Passar a lista de usuários e o usuário selecionado (se houver) */}
                <UserFilter label="Analista de compras" options={users} value={selectedUser} onChange={setSelectedUser} />
                <section className="xl:pr-48 pl-20 md:px-20">
                    {/* Tabela de logs aqui */}
                </section>
            </main>
        </div>
    );
}