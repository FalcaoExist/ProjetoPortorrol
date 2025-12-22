import { useState, useCallback } from "react";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import UserProfileSummary from "../components/user_profile_summary/UserProfileSumary";
import SuppliersTable from "../components/suppliers_table/SuppliersTable";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal.jsx";
import { useAuth } from "../context/authContext";
import { useLeadtimeHistory } from "../hooks/useLeadtimeHistory";

// Substituir por fornecedores vindos da API quando a integração estiver pronta.
const initialSuppliers = [
    { id: 1, name: "Timken", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 60000, leadtime: 15 },
    { id: 2, name: "NSK", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 30000, leadtime: 9 },
    { id: 3, name: "FRM", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 30000, leadtime: 9 },
    { id: 4, name: "BGL", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 10000, leadtime: 7 },
    { id: 5, name: "IKO", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 45000, leadtime: 20 },
    { id: 6, name: "SAV", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 45000, leadtime: 20 },
];

const initialLeadtimeHistory = {
    1: [
        { id: "1-2025-10-01", recordedAt: "2025-10-01", start: "2025-11-15", end: "2025-12-20", budget: 58000, leadtime: 16, notes: "Ajuste após renegociação." },
        { id: "1-2025-08-10", recordedAt: "2025-08-10", start: "2025-10-01", end: "2025-11-20", budget: 62000, leadtime: 18, notes: "Linha base anterior." },
    ],
    2: [
        { id: "2-2025-09-20", recordedAt: "2025-09-20", start: "2025-11-05", end: "2025-12-10", budget: 32000, leadtime: 10, notes: "Ajuste de preço." },
        { id: "2-2025-07-01", recordedAt: "2025-07-01", start: "2025-10-10", end: "2025-11-25", budget: 30000, leadtime: 12, notes: "Prazo revisado." },
    ],
    3: [
        { id: "3-2025-09-15", recordedAt: "2025-09-15", start: "2025-10-20", end: "2025-12-05", budget: 31000, leadtime: 11, notes: "Leadtime reduzido." },
        { id: "3-2025-06-10", recordedAt: "2025-06-10", start: "2025-09-15", end: "2025-11-30", budget: 29500, leadtime: 13, notes: "Primeira proposta." },
    ],
    4: [
        { id: "4-2025-08-22", recordedAt: "2025-08-22", start: "2025-10-05", end: "2025-11-28", budget: 12000, leadtime: 8, notes: "Nova linha aprovada." },
    ],
    5: [
        { id: "5-2025-09-02", recordedAt: "2025-09-02", start: "2025-10-18", end: "2025-12-01", budget: 47000, leadtime: 21, notes: "Leadtime impactado por logística." },
    ],
    6: [
        { id: "6-2025-09-12", recordedAt: "2025-09-12", start: "2025-10-25", end: "2025-12-05", budget: 43000, leadtime: 19, notes: "Prazo ajustado." },
    ],
};

export default function ListSuppliers() {
    const { user } = useAuth();

    const [suppliers, setSuppliers] = useState(initialSuppliers);
    const {
        history: leadtimeHistory,
        registerSnapshot,
        removeSupplierHistory,
    } = useLeadtimeHistory(initialLeadtimeHistory);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const handleRequestDeleteSupplier = useCallback((supplier) => {
        if (!supplier) return;
        setDeleteTarget(supplier);
        setDeleteModalOpen(true);
    }, []);

    const handleCloseDeleteModal = useCallback(() => {
        setDeleteModalOpen(false);
        setDeleteTarget(null);
    }, []);

    const handleConfirmDeleteSupplier = useCallback(async () => {
        if (!deleteTarget) {
            return { success: false, message: "Nenhum fornecedor selecionado." };
        }

        setSuppliers((prevSuppliers) => prevSuppliers.filter((supplier) => supplier.id !== deleteTarget.id));
        removeSupplierHistory(deleteTarget.id);

        return {
            success: true,
            message: `Fornecedor ${deleteTarget.name || ""} excluído com sucesso.`,
        };
    }, [deleteTarget]);

    const handleRegisterCurrentSnapshot = useCallback((supplierId, notes = "") => {
        const supplier = suppliers.find((row) => row.id === supplierId);
        return registerSnapshot(supplier, notes);
    }, [suppliers, registerSnapshot]);

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />

            <main className="min-w-0">
                <div className="flex flex-col">
                    <Header pageTitle={"Configurações"} userName={user?.name || "Usuário"} />
                    <UserProfileSummary 
                        role={user?.role || "Visitante"} 
                        userName={user?.name || "..."} 
                        userEmail={user?.email || "..."}
                    />

                    <section className="px-8 md:px-12 pb-10">
                        <SuppliersTable 
                            rows={suppliers}
                            setRows={setSuppliers}
                            onRequestDelete={handleRequestDeleteSupplier}
                            historyBySupplier={leadtimeHistory}
                            onRegisterCurrentSnapshot={handleRegisterCurrentSnapshot}
                        />
                    </section>
                </div>
            </main> 
            <ConfirmDeleteModal
                isOpen={deleteModalOpen}
                onClose={handleCloseDeleteModal}
                title="Excluir fornecedor"
                entityLabel={deleteTarget?.name ? `o fornecedor "${deleteTarget.name}"` : "este fornecedor"}
                confirmationKeyword="CONFIRMO"
                description={deleteTarget?.name ? `Esta ação removerá permanentemente o fornecedor ${deleteTarget.name}.` : undefined}
                onConfirm={handleConfirmDeleteSupplier}
            />
        </div>
    );
}
