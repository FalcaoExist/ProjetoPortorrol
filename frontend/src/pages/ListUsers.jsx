import { useState, useEffect } from "react";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import UserProfileSummary from "../components/user_profile_summary/UserProfileSumary";
import UsersTable from "../components/users_table/UsersTable";
import AddBuyerModal from "../components/add_buyer_modal/AddBuyerModal.jsx";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal.jsx";
import ChangePasswordModal from "../components/change_password_modal/ChangePasswordModal";

import { useAuth } from "../context/authContext";
import { getUsers, deleteUser, updateUser } from "../services/validators/api/userService";
import { createBuyerApi, checkEmailApi } from "../services/buyerServices";
import { getSuppliers } from "../services/supplierService"; // [NOVO IMPORT]

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

    useEffect(() => {
        fetchData();
    }, []);

    // [ALTERADO] Busca usuários E fornecedores em paralelo
    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, suppliersData] = await Promise.all([
                getUsers(),
                getSuppliers()
            ]);

            setUsers(usersData);

            // Adaptação: O Backend pode retornar objetos {id, name}, 
            // mas os componentes (Table/Modal) esperam um array de strings ["Timken", "NSK"]
            const formattedSuppliers = Array.isArray(suppliersData)
                ? suppliersData.map(s => s.name || s) // Pega a propriedade .name se for objeto, ou usa a string direta
                : [];
            
            setSuppliersOptions(formattedSuppliers);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            alert("Não foi possível carregar os dados do sistema.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            // Regras de deleção: proteger gestor principal por email
            const target = users.find(u => u.user_id === userId);
            const protectedEmail = "dionatas.terres@portorrol.com";
            if (target && target.email === protectedEmail) {
                alert("Impossível excluir o gestor!");
                return { success: false, message: "Usuário protegido contra exclusão." };
            }

            await deleteUser(userId);
            setUsers(prev => prev.filter(u => u.user_id !== userId));
            return { success: true, message: "Usuário excluído com sucesso!" };
        } catch (error) {
            return { success: false, message: error.message || "Erro ao excluir usuário." };
        }
    };

    const handleRequestDeleteUser = (userToDelete) => {
        if (!userToDelete) return;
        setDeleteTarget(userToDelete);
        setDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setDeleteModalOpen(false);
        setDeleteTarget(null);
    };

    const handleUpdateUser = async (userId, updatedData) => {
        try {
            const updatedUser = await updateUser(userId, updatedData);
            setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, ...updatedUser } : u));
            return updatedUser;
        } catch (error) {
            alert("Erro de conexão ao tentar salvar.");
            throw error; 
        }
    };

    const openChangePasswordModal = (userId, userName) => {
        setPasswordModal({ isOpen: true, userId, userName });
    };

    const handleSavePassword = async (newPassword) => {
        try {
            await updateUser(passwordModal.userId, { password: newPassword });
            return { success: true, message: "Senha alterada com sucesso!" };
        } catch (error) {
            console.error(error);
            return { success: false, message: error?.message || "Erro ao alterar senha. Tente novamente." };
        }
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        fetchData(); // Recarrega tudo (usuários e fornecedores) ao fechar modal
    };

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />

            <main className="min-w-0">
                <div className="flex flex-col">
                    <Header pageTitle={"Configurações"} userName={user?.name || "..."} />
                    
                    <UserProfileSummary 
                        role={user?.role} 
                        userName={user?.name} 
                        userEmail={user?.email}
                    />
                    
                    <section className="px-8 md:px-12 pb-10">
                        {loading ? (
                            <div className="p-10 text-center text-gray-500 font-poppins animate-pulse">
                                Carregando dados do sistema...
                            </div>
                        ) : (
                            <UsersTable 
                                users={users} 
                                onDelete={handleRequestDeleteUser}
                                onUpdate={handleUpdateUser}
                                onChangePassword={openChangePasswordModal}
                                availableSuppliers={suppliersOptions} // Passa a lista dinâmica
                            />
                        )}

                        {isGestor && (
                            <button
                                onClick={() => setOpenModal(true)}
                                className="bg-[#F43629] hover:bg-white text-white hover:text-black shadow-lg font-poppins uppercase text-sm p-2 rounded-md mt-6 transition-colors"
                            >
                                Adicionar Comprador
                            </button>
                        )}
                    </section>
                </div>
            </main>
            
            <AddBuyerModal 
                isOpen={openModal} 
                onClose={handleCloseModal}
                onSave={createBuyerApi}     
                onCheckEmail={checkEmailApi} 
                suppliersOptions={suppliersOptions} // Passa a lista dinâmica
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