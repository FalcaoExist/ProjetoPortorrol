import { useState, useMemo } from "react";
import Navbar from "../components/nav_bar/NavBar";
import Header from "../components/header/Header";
import UserFilter from "../components/user_filter/UserFilter";
import RecordsTable from "../components/records_table/RecordsTable";
import { useAuth } from "../context/authContext";

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

const SAMPLE_RECORDS = [
    { id: 1, user: "Ana Beatriz", timestamp: "2025-11-21T10:00:00Z", action: "Login", description: "Login bem-sucedido para 'Ana Beatriz' #123" },
    { id: 2, user: "Carlos Alberto", timestamp: "2025-11-21T11:30:00Z", action: "Novo pedido", description: "Nova requisição de compra #456" },
    { id: 3, user: "Ana Beatriz", timestamp: "2025-11-22T14:00:00Z", action: "Exclusão", description: "Exlcusão de item da requisição de compra" },
    { id: 4, user: "Sistema", timestamp: "2025-11-22T15:00:00Z", action: "Login", description: "Login bem-sucedido para 'Carlos Alberto'" },
    { id: 5, user: "Carlos Alberto", timestamp: "2025-11-23T09:00:00Z", action: "Relatórios", description: "Exportação 'Estoque Timken'" },
];


export default function Records({ users = DEFAULT_USERS }) {
    // Caso alguma página redirecione para essa com algum usuário já selecionado
    // Aqui está selecionado o primeiro para placeholder
    const [selectedUser, setSelectedUser] = useState(() => users[1] ?? null);
    const { user } = useAuth();
    

    const filteredRecords = useMemo(() => {
        if (!selectedUser) {
            return SAMPLE_RECORDS; // Se nenhum usuário for selecionado, mostra todos os registros
        }
        return SAMPLE_RECORDS.filter(record => record.user === selectedUser.name);
    }, [selectedUser]);

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />
            <main className="min-w-0 flex flex-col">
                <Header pageTitle={"Registros"} userName={user?.name || "Usuário"} />
                {/* Passar a lista de usuários e o usuário selecionado (se houver) */}
                <UserFilter label="Analista de compras" options={users} value={selectedUser} onChange={setSelectedUser} />
                <section className="xl:pr-48 pl-20 md:px-20 pt-8">
                    <RecordsTable records={filteredRecords} />
                </section>
            </main>
        </div>
    );
}