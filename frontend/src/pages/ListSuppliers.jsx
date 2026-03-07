import { useState, useCallback, useEffect } from "react";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import UserProfileSummary from "../components/user_profile_summary/UserProfileSumary";
import SuppliersTable from "../components/suppliers_table/SuppliersTable";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal.jsx";
import { useAuth } from "../context/authContext";

import { getSuppliers, deleteSupplier, mapSupplierToGrid } from "../services/supplierService";
import { logger } from "../utils/logger";

export default function ListSuppliers() {
    const { user } = useAuth();

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        async function fetchSuppliers() {
            try {
                const data = await getSuppliers();

                const formatted = (data || []).map(mapSupplierToGrid);

                setSuppliers(formatted);
            } catch (error) {
                logger.error("Erro ao carregar fornecedores:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchSuppliers();
    }, []);

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

        try {
            await deleteSupplier(deleteTarget.id);

            setSuppliers((prev) =>
                prev.filter((supplier) => supplier.id !== deleteTarget.id)
            );

            return {
                success: true,
                message: `Fornecedor ${deleteTarget.name} excluído com sucesso.`,
            };
        } catch (error) {
            logger.error("Erro ao excluir fornecedor:", error);

            return {
                success: false,
                message: "Erro ao excluir fornecedor.",
            };
        }
    }, [deleteTarget]);

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />

            <main className="min-w-0">
                <div className="flex flex-col">
                    <Header
                        pageTitle={"Configurações"}
                        userName={user?.name || "Usuário"}
                    />

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
                            loading={loading}
                        />
                    </section>
                </div>
            </main>

            <ConfirmDeleteModal
                isOpen={deleteModalOpen}
                onClose={handleCloseDeleteModal}
                title="Excluir fornecedor"
                entityLabel={
                    deleteTarget?.name
                        ? `o fornecedor "${deleteTarget.name}"`
                        : "este fornecedor"
                }
                confirmationKeyword="CONFIRMO"
                description={
                    deleteTarget?.name
                        ? `Esta ação removerá permanentemente o fornecedor ${deleteTarget.name}.`
                        : undefined
                }
                onConfirm={handleConfirmDeleteSupplier}
            />
        </div>
    );
}