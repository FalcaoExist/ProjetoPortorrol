import { useState, useEffect } from "react";
import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import UserProfileSummary from "../components/user_profile_summary/UserProfileSumary";
import UsersTable from "../components/users_table/UsersTable";
import AddBuyerModal from "../components/add_buyer_modal/AddBuyerModal.jsx";

// 1. Importa os serviços que conectam com o Supabase
import { getUsers } from "../services/validators/api/userService";
import { createBuyerApi, checkEmailApi } from "../services/buyerServices";
export default function ListUsers() {
    const [openModal, setOpenModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Lista de fornecedores para o Dropdown (Pode vir de uma API futuramente)
    const [suppliersOptions] = useState(["Timken", "NSK", "SKF", "Fag", "Schaeffler"]);

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

    // 2. Função chamada quando o modal fecha (para recarregar a tabela)
    const handleCloseModal = () => {
        setOpenModal(false);
        fetchUsers(); // Recarrega a lista do Supabase para mostrar o novo usuário
    };

    return (
        <div className="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)]">
            <Navbar />

            <main className="min-w-0">
                <div className="flex flex-col">
                    <Header pageTitle={"Configurações"} userName={"Dionatas"} />
                    <UserProfileSummary 
                        role="Gestor" 
                        userName={"Dionatas Terres"} 
                        userEmail={"dionatas.terres@portorrol.com"}
                    />
                    <section className="xl:pr-48 pl-20 md:px-20">
                        {loading ? (
                            <div className="p-10 text-center text-gray-500 font-poppins animate-pulse">
                                Atualizando dados...
                            </div>
                        ) : (
                            <UsersTable users={users} />
                        )}

                        <button
                            onClick={() => setOpenModal(true)}
                            className="bg-[#5A44B0] hover:bg-white text-white hover:text-black shadow-lg font-poppins uppercase text-sm p-2 rounded-md mt-6"
                        >
                            Adicionar Comprador
                        </button>
                    </section>
                </div>
            </main>
            
            {/* 3. Conecta o Modal robusto aos serviços do Supabase */}
            <AddBuyerModal 
                isOpen={openModal} 
                onClose={handleCloseModal}
                
                // Passa as funções que realmente vão no banco
                onSave={createBuyerApi}
                onCheckEmail={checkEmailApi}
                
                // Passa as opções de fornecedores
                suppliersOptions={suppliersOptions}
            />
        </div>
    );
}