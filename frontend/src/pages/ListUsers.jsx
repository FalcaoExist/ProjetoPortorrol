import { useState, useEffect } from "react";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import UserProfileSummary from "../components/user_profile_summary/UserProfileSumary";
import UsersTable from "../components/users_table/UsersTable";
import AddBuyerModal from "../components/add_buyer_modal/AddBuyerModal.jsx";

import { useAuth } from "../context/authContext";
import { getUsers, deleteUser, updateUser } from "../services/validators/api/userService";
import { createBuyerApi, checkEmailApi } from "../services/buyerServices";

export default function ListUsers() {
    const { user, isGestor } = useAuth();

    const [openModal, setOpenModal] = useState(false);
    const [users, setUsers] = useState([]); // Estado começa vazio esperando dados da API
    const [loading, setLoading] = useState(true);
    
    // Lista de fornecedores para o dropdown de edição/criação (Definida para ser consistente)
    const [suppliersOptions] = useState([
        "Timken", 
        "NSK", 
        "FRM", 
        "BGL", 
        "IKO", 
        "SAV"
    ]);

    // Carrega dados reais ao montar a tela
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers(); 
            setUsers(data);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            alert("Não foi possível carregar a lista de usuários.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        const confirm = window.confirm("Tem certeza que deseja excluir este usuário?");
        if (!confirm) return;

        try {
            await deleteUser(userId);
            // Atualiza o estado localmente para feedback visual rápido
            setUsers(prev => prev.filter(u => u.user_id !== userId));
            alert("Usuário excluído com sucesso!");
        } catch (error) {
            alert(error.message || "Erro ao excluir usuário.");
        }
    };

    const handleUpdateUser = async (userId, updatedData) => {
        try {
            // Usa o serviço centralizado para PUT
            const updatedUser = await updateUser(userId, updatedData);
            // Atualiza a lista localmente com os dados novos
            setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, ...updatedUser } : u));
            return updatedUser;
        } catch (error) {
            alert("Erro de conexão ao tentar salvar.");
            throw error; 
        }
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        fetchUsers(); // Recarrega a lista para mostrar o novo usuário
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
                                onDelete={handleDeleteUser}
                                onUpdate={handleUpdateUser}
                                availableSuppliers={suppliersOptions} 
                            />
                        )}

                        {isGestor && (
                            <button
                                onClick={() => setOpenModal(true)}
                                className="bg-[#5A44B0] hover:bg-white text-white hover:text-black shadow-lg font-poppins uppercase text-sm p-2 rounded-md mt-6 transition-colors"
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
        </div>
    );
}