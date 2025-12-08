import { useState, useEffect, useMemo } from "react";

import Navbar from "../components/nav_bar/NavBar";
import Header from "../components/header/Header";
import UserFilter from "../components/user_filter/UserFilter";
import RecordsTable from "../components/records_table/RecordsTable";
import { useAuth } from "../context/authContext";
import { getAuditLogs } from "../services/auditService";

const ALL_USERS_OPTION = { id: "all-users", name: "Todos" };

export default function Records() {
    const { user, isGestor } = useAuth();

    const [records, setRecords] = useState([]);
    const [usersList, setUsersList] = useState([ALL_USERS_OPTION]);
    const [selectedUser, setSelectedUser] = useState(ALL_USERS_OPTION);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isGestor) {
            setLoading(false);
            return;
        }
        fetchAuditLogs();
    }, [isGestor]);

    const fetchAuditLogs = async () => {
        setLoading(true);

        try {
            const logs = await getAuditLogs({ limit: 500 });

            // Formatar logs para RecordsTable
            const mapped = logs.map((log) => ({
                id: log.log_id || `${log.user_id}-${log.created_at}-${Math.random()}`,
                
                // [MUDANÇA AQUI] Usa o campo user_name vindo do backend
                // Se não existir, usa o ID como fallback
                user: log.user_name || log.user_id || "Sistema",
                
                timestamp: log.created_at,
                action: log.action,
                description: formatDescription(log)
            }));

            setRecords(mapped);

            // Gerar lista de usuários única para o filtro do topo
            const uniqueUsers = Array.from(
                new Set(mapped.map((l) => l.user).filter(Boolean))
            ).map((name, index) => ({
                id: index + 1,
                name
            }));

            setUsersList([ALL_USERS_OPTION, ...uniqueUsers]);

        } catch (err) {
            console.error("Erro ao carregar logs:", err);
            setRecords([]);
        }

        setLoading(false);
    };

    const handleUserFilterChange = (option) => {
        setSelectedUser(option ?? ALL_USERS_OPTION);
    };

    function formatDescription(log) {
        if (!log.extra) return "";
        try {
            if (typeof log.extra === "string") return log.extra;
            // Remove aspas e chaves para ficar mais limpo visualmente
            return JSON.stringify(log.extra).replace(/"/g, ' ').replace(/[{}]/g, '');
        } catch {
            return "";
        }
    }

    const filteredRecords = useMemo(() => {
        if (!selectedUser || selectedUser.id === ALL_USERS_OPTION.id) return records;
        return records.filter((rec) => rec.user === selectedUser.name);
    }, [records, selectedUser]);

    if (!isGestor) {
        return (
            <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
                <Navbar />
                <main className="min-w-0 flex items-center justify-center p-20">
                    <p className="text-gray-600 text-lg font-poppins">
                        Acesso negado. Somente gestores podem visualizar os registros.
                    </p>
                </main>
            </div>
        );
    }

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />

            <main className="min-w-0 flex flex-col">
                <Header pageTitle={"Registros"} userName={user?.name || "Usuário"} />

                <UserFilter
                    label="Filtrar por Usuário"
                    options={usersList}
                    value={selectedUser}
                    onChange={handleUserFilterChange}
                    containerClassName="px-8 py-6 md:px-12 md:py-8"
                    placeholder="Selecione um usuário"
                />

                <section className="px-8 md:px-12 pb-10">
                    {loading ? (
                        <div className="p-10 text-center text-gray-500 font-poppins animate-pulse">
                            Carregando registros...
                        </div>
                    ) : (
                        <RecordsTable records={filteredRecords} />
                    )}
                </section>
            </main>
        </div>
    );
}