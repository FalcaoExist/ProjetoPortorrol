import Header from "../components/header/Header";
import Navbar from "../components/nav_bar/NavBar";
import UserProfileSummary from "../components/user_profile_summary/UserProfileSumary";
import UsersTable from "../components/users_table/UsersTable";
import AddBuyerModal from "../components/add_buyer_modal/AddBuyerModal.jsx";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal.jsx";
import ChangePasswordModal from "../components/change_password_modal/ChangePasswordModal";

import { useAuth } from "../context/authContext";
import { useUsersPageLogic } from "../hooks/useUsersPageLogic";

export default function ListUsers() {
    const { user, isGestor } = useAuth();
    const {
        users,
        loading,
        suppliersOptions,
        openModal,
        setOpenModal,
        passwordModal,
        deleteModalOpen,
        deleteTarget,
        handleRequestDeleteUser,
        handleCloseDeleteModal,
        handleUpdateUser,
        openChangePasswordModal,
        closeChangePasswordModal,
        handleSavePassword,
        handleCloseAddBuyerModal,
        handleConfirmDelete,
        createBuyerApi,
        checkEmailApi,
    } = useUsersPageLogic();

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
                        <UsersTable 
                            users={users} 
                            onDelete={handleRequestDeleteUser}
                            onUpdate={handleUpdateUser}
                            onChangePassword={openChangePasswordModal}
                            availableSuppliers={suppliersOptions} // Passa a lista dinâmica
                            loading={loading}
                        />

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
                onClose={handleCloseAddBuyerModal}
                onSave={createBuyerApi}     
                onCheckEmail={checkEmailApi} 
                suppliersOptions={suppliersOptions} // Passa a lista dinâmica
            />

            <ChangePasswordModal 
                isOpen={passwordModal.isOpen}
                onClose={closeChangePasswordModal}
                onSave={handleSavePassword}
                userName={passwordModal.userName}
            />

            <ConfirmDeleteModal
                isOpen={deleteModalOpen}
                onClose={handleCloseDeleteModal}
                entityLabel={deleteTarget ? `o usuário "${deleteTarget.name}"` : "este usuário"}
                confirmationKeyword="CONFIRMO"
                description={deleteTarget ? `Esta ação removerá permanentemente o usuário ${deleteTarget.name} (${deleteTarget.email || "sem e-mail"}).` : undefined}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}