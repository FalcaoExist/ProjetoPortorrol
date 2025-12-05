import { useState, useCallback } from "react";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import UserProfileSummary from "../components/user_profile_summary/UserProfileSumary";
import SuppliersTable from "../components/suppliers_table/SuppliersTable";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal.jsx";
import { useAuth } from "../context/authContext";

// Substituir por fornecedores vindos da API quando a integração estiver pronta.
const initialSuppliers = [
    { id: 1, name: "Timken", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 60000, leadtime: 15 },
    { id: 2, name: "NSK", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 30000, leadtime: 9 },
    { id: 3, name: "FRM", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 30000, leadtime: 9 },
    { id: 4, name: "BGL", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 10000, leadtime: 7 },
    { id: 5, name: "IKO", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 45000, leadtime: 20 },
    { id: 6, name: "SAV", start: new Date("2025-12-01"), end: new Date("2026-01-01"), budget: 45000, leadtime: 20 },
];

export default function ListSuppliers() {
    const { user } = useAuth();

    const [suppliers, setSuppliers] = useState(initialSuppliers);
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

        return {
            success: true,
            message: `Fornecedor ${deleteTarget.name || ""} excluído com sucesso.`,
        };
    }, [deleteTarget]);

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

                    <section className="xl:pr-48 pl-20 md:px-20">
                        <SuppliersTable 
                            rows={suppliers}
                            setRows={setSuppliers}
                            onRequestDelete={handleRequestDeleteSupplier}
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
