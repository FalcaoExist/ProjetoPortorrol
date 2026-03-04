import { useState, useEffect, useMemo } from "react";
import { FiEdit } from "react-icons/fi";

import Navbar from "../components/nav_bar/NavBar";
import Header from "../components/header/Header";
import UserFilter from "../components/user_filter/UserFilter";
import RecordsTable from "../components/records_table/RecordsTable";
import TimeEditModal from "../components/records_table/TimeEditModal";
import { useAuth } from "../context/authContext";
import { getAuditLogs } from "../services/auditService";
import { logger } from "../utils/logger";

const ALL_USERS_OPTION = { id: "all-users", name: "Todos" };

export default function Records() {
    const { user, isGestor } = useAuth();

    const [records, setRecords] = useState([]);
    const [usersList, setUsersList] = useState([ALL_USERS_OPTION]);
    const [selectedUser, setSelectedUser] = useState(ALL_USERS_OPTION);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [importTime, setImportTime] = useState("05:00");

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

            const mapped = logs.map((log) => ({
                id: log.id ?? log.log_id,              
                user: log.user,                        
                timestamp: log.timestamp,              
                action_label: log.action_label,        
                severity: log.severity,                
                description: log.description,          
            }));

            setRecords(mapped);

            const uniqueUsers = Array.from(
                new Set(mapped.map((l) => l.user).filter(Boolean))
            ).map((name, index) => ({
                id: index + 1,
                name
            }));

            setUsersList([ALL_USERS_OPTION, ...uniqueUsers]);

        } catch (err) {
            logger.error("Erro ao carregar logs:", err);
            setRecords([]);
        }

        setLoading(false);
    };

    const handleUserFilterChange = (option) => {
        setSelectedUser(option ?? ALL_USERS_OPTION);
    };

    const handleSaveTime = (newTime) => {
        setImportTime(newTime);
    };

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
                    <RecordsTable records={filteredRecords} loading={loading} />
                </section>
            </main>
        </div>
    );
}