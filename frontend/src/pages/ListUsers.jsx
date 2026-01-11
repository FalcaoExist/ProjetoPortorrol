import { useState, useEffect } from "react";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import UserProfileSummary from "../components/user_profile_summary/UserProfileSumary";
import UsersTable from "../components/users_table/UsersTable";
import AddBuyerModal from "../components/add_buyer_modal/AddBuyerModal.jsx";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal.jsx";
import ChangePasswordModal from "../components/change_password_modal/ChangePasswordModal";

import { useAuth } from "../context/authContext";
import { getUsers, deleteUser } from "../services/validators/api/userService";
import { createBuyerApi, checkEmailApi } from "../services/buyerServices";
// CORREÇÃO: Importação padrão (sem chaves) pois o service exporta um objeto "default"
import supplierService from "../services/supplierService"; 

export default function ListUsers() {
    const { user, isGestor } = useAuth();

    const [openModal, setOpenModal] = useState(false);
    
    const [passwordModal, setPasswordModal] = useState({ 
        isOpen: false, 
        userId: null, 
        userName: "" 
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    // Dinâmico via API
    const [suppliersOptions, setSuppliersOptions] = useState([]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Carregar Usuários e Fornecedores
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Carregar Usuários
            const dataUsers = await getUsers();
            setUsers(dataUsers);

            // 2. Carregar Fornecedores (Para o Modal de Criar Comprador)
            // CORREÇÃO: Usamos .getAll() do serviço
            const dataSuppliers = await supplierService.getAll();
            
            // Mapeamos apenas o nome para o dropdown, já que o backend de User
            // atualmente espera uma lista de nomes no campo 'supplier'
            if (dataSuppliers && Array.isArray(dataSuppliers)) {
                setSuppliersOptions(dataSuppliers.map(s => s.name));
            }

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handler para criar comprador (recarrega lista após sucesso)
    const handleCreateBuyer = async (formData) => {
        const result = await createBuyerApi(formData);
        if (result.success) {
            loadData(); // Recarrega a tabela
            return { success: true };
        }
        return result;
    };

    // Handler para excluir
    const handleRequestDelete = (userData) => {
        setDeleteTarget(userData);
        setDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setDeleteModalOpen(false);
        setDeleteTarget(null);
    };

    const handleDeleteUser = async (userId) => {
        try {
            await deleteUser(userId);
            setUsers(current => current.filter(u => u.user_id !== userId));
            return { success: true };
        } catch (error) {
            console.error("Erro ao deletar:", error);
            return { success: false, message: "Erro ao excluir usuário." };
        }
    };

    // Handler para Atualizar (Edição inline da tabela)
    const handleUpdateUser = async (id, updatedData) => {
        // A lógica de update real deve ser importada de userService se necessário,
        // mas aqui estamos apenas passando para a tabela ou usando logica local
        console.log("Update solicitado:", id, updatedData);
        return { success: true }; // Mock por enquanto, conecte ao userService.updateUser se precisar
    };

    // Abrir Modal de Senha
    const handleOpenPasswordModal = (userId, userName) => {
        setPasswordModal({ isOpen: true, userId, userName });
    };

    const handleSavePassword = async () => {
        // O modal já gerencia o salvamento via hook interno, 
        // aqui apenas fechamos quando terminar.
        setPasswordModal(prev => ({ ...prev, isOpen: false }));
    };

    const handleCloseModal = () => setOpenModal(false);

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />
            <main className="min-w-0">
                <div className="flex flex-col">
                    <Header pageTitle={"Gerenciar Compradores"} userName={user?.name || "Usuário"} />
                    <UserProfileSummary 
                        role={user?.role || "Visitante"} 
                        userName={user?.name || "..."} 
                        userEmail={user?.email || "..."}
                    />

                    <section className="px-8 md:px-12 pb-10">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-700 font-poppins">Lista de Usuários</h2>
                            <button
                                onClick={() => setOpenModal(true)}
                                className="bg-[#5A44B0] hover:bg-[#4a3794] text-white px-5 py-2.5 rounded-xl font-poppins shadow-md transition-all text-sm uppercase font-medium"
                            >
                                + Novo Comprador
                            </button>
                        </div>

                        {loading ? (
                            <p className="text-center text-gray-500 py-10 font-poppins">Carregando...</p>
                        ) : (
                            <UsersTable 
                                users={users} 
                                onDelete={handleRequestDelete}
                                onUpdate={handleUpdateUser}
                                onChangePassword={handleOpenPasswordModal}
                                availableSuppliers={suppliersOptions}
                            />
                        )}
                    </section>
                </div>
            </main>
            
            <AddBuyerModal 
                isOpen={openModal} 
                onClose={handleCloseModal}
                onSave={handleCreateBuyer}     
                onCheckEmail={checkEmailApi} 
                suppliersOptions={suppliersOptions} 
            />

            <ChangePasswordModal 
                isOpen={passwordModal.isOpen}
                onClose={() => setPasswordModal({ ...passwordModal, isOpen: false })}
                onSave={handleSavePassword}
                userName={passwordModal.userName}
            />

            <ConfirmDeleteModal
                isOpen={deleteModalOpen}
                onClose={handleCloseDeleteModal}
                entityLabel={deleteTarget ? `o usuário "${deleteTarget.name}"` : "este usuário"}
                confirmationKeyword="CONFIRMO"
                description={deleteTarget ? `Esta ação removerá permanentemente o usuário ${deleteTarget.name} (${deleteTarget.email || "sem e-mail"}).` : undefined}
                onConfirm={async () => {
                    if (!deleteTarget) {
                        return { success: false, message: "Nenhum usuário selecionado." };
                    }
                    return handleDeleteUser(deleteTarget.user_id);
                }}
            />
        </div>
    );
}