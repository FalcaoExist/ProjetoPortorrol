import { useState, useEffect } from "react";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import UserProfileSummary from "../components/user_profile_summary/UserProfileSumary";
import UsersTable from "../components/users_table/UsersTable";
import AddBuyerModal from "../components/add_buyer_modal/AddBuyerModal.jsx";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal.jsx";

import { useAuth } from "../context/authContext";

import { getUsers } from "../services/validators/api/userService";
import { createBuyerApi, checkEmailApi } from "../services/buyerServices";

export default function ListUsers() {
    const { user, isGestor } = useAuth();

    const [openModal, setOpenModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [suppliersOptions] = useState(["Timken", "NSK", "SKF", "Fag", "Schaeffler"]);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers(); 
            setUsers(data);
        } catch (error) {
            console.error("Erro ao atualizar lista:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/users/${userId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });

            if (response.ok) {
                await fetchUsers();
                return { success: true, message: "Usuário excluído com sucesso!" };
            }

            const errorData = await response.json().catch(() => ({}));
            return { success: false, message: errorData.detail || "Erro ao excluir." };
        } catch (error) {
            console.error("Erro:", error);
            return { success: false, message: "Erro de conexão." };
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
            const response = await fetch(`http://127.0.0.1:8000/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData)
            });

            const data = await response.json();

            if (response.ok) {
                return data.user; 
            } else {
                alert(data.detail || "Erro ao atualizar usuário.");
                throw new Error("Erro na API");
            }
        } catch (error) {
            console.error("Erro no update:", error);
            alert("Erro de conexão ao tentar salvar.");
            throw error; 
        }
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        fetchUsers(); 
    };

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />

            <main className="min-w-0">
                <div className="flex flex-col">
                    {/*  Usa o nome dinâmico do Contexto */}
                    <Header pageTitle={"Configurações"} userName={user?.name || "Usuário"} />
                    
                    {/*  Usa os dados dinâmicos do Contexto */}
                    <UserProfileSummary 
                        role={user?.role || "Visitante"} 
                        userName={user?.name || "..."} 
                        userEmail={user?.email || "..."}
                    />
                    
                    <section className="xl:pr-48 pl-20 md:px-20">
                        {loading ? (
                            <div className="p-10 text-center text-gray-500 font-poppins animate-pulse">
                                Atualizando dados...
                            </div>
                        ) : (
                            <UsersTable 
                                users={users} 
                                onDelete={handleRequestDeleteUser}
                                onUpdate={handleUpdateUser}
                            />
                        )}

                        {}
                        {isGestor && (
                            <button
                                onClick={() => setOpenModal(true)}
                                className="bg-[#5A44B0] hover:bg-white text-white hover:text-black shadow-lg font-poppins uppercase text-sm p-2 rounded-md mt-6"
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
                suppliersOptions={suppliersOptions}
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