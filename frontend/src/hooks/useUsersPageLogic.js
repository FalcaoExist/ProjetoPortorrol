import { useCallback, useEffect, useState } from "react";

import { createBuyerApi, checkEmailApi } from "../services/buyerServices";
import { getSuppliers } from "../services/supplierService";
import { deleteUser, getUsers, updateUser } from "../services/validators/api/userService";
import { logger } from "../utils/logger";

const GESTOR_PROTECTED_EMAIL = "dionatas.terres@portorrol.com";

export function useUsersPageLogic() {
  const [openModal, setOpenModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState({ isOpen: false, userId: null, userName: "" });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suppliersOptions, setSuppliersOptions] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, suppliersData] = await Promise.all([getUsers(), getSuppliers()]);

      setUsers(usersData);

      const formattedSuppliers = Array.isArray(suppliersData)
        ? suppliersData.map((supplier) => supplier?.name || supplier)
        : [];

      setSuppliersOptions(formattedSuppliers);
    } catch (error) {
      logger.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteUser = useCallback(
    async (userId) => {
      try {
        const target = users.find((user) => user.user_id === userId);
        if (target?.email === GESTOR_PROTECTED_EMAIL) {
          logger.warn("Tentativa de excluir usuário gestor protegido.", { userId });
          return { success: false, message: "Usuário protegido contra exclusão." };
        }

        await deleteUser(userId);
        setUsers((previous) => previous.filter((user) => user.user_id !== userId));
        return { success: true, message: "Usuário excluído com sucesso!" };
      } catch (error) {
        return { success: false, message: error?.message || "Erro ao excluir usuário." };
      }
    },
    [users]
  );

  const handleRequestDeleteUser = useCallback((userToDelete) => {
    if (!userToDelete) return;
    setDeleteTarget(userToDelete);
    setDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  }, []);

  const handleUpdateUser = useCallback(async (userId, updatedData) => {
    const updatedUser = await updateUser(userId, updatedData);
    setUsers((previous) =>
      previous.map((user) => (user.user_id === userId ? { ...user, ...updatedUser } : user))
    );
    return updatedUser;
  }, []);

  const openChangePasswordModal = useCallback((userId, userName) => {
    setPasswordModal({ isOpen: true, userId, userName });
  }, []);

  const closeChangePasswordModal = useCallback(() => {
    setPasswordModal((previous) => ({ ...previous, isOpen: false }));
  }, []);

  const handleSavePassword = useCallback(async (newPassword) => {
    try {
      await updateUser(passwordModal.userId, { password: newPassword });
      return { success: true, message: "Senha alterada com sucesso!" };
    } catch (error) {
      logger.error(error);
      return { success: false, message: error?.message || "Erro ao alterar senha. Tente novamente." };
    }
  }, [passwordModal.userId]);

  const handleCloseAddBuyerModal = useCallback(() => {
    setOpenModal(false);
    fetchData();
  }, [fetchData]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) {
      return { success: false, message: "Nenhum usuário selecionado." };
    }
    return handleDeleteUser(deleteTarget.user_id);
  }, [deleteTarget, handleDeleteUser]);

  return {
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
  };
}

export default useUsersPageLogic;
