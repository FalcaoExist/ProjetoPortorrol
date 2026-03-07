import { useCallback, useState } from "react";

import {
  createSupplier,
  mapSupplierToGrid,
  toDateOnlyString,
  updateSupplier,
} from "../services/supplierService";
import { logger } from "../utils/logger";

export function useSuppliersTableLogic({ rows = [], setRows, onRequestDelete }) {
  const [openModal, setOpenModal] = useState(false);
  const [leadtimeModalOpen, setLeadtimeModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const handleAdd = useCallback(() => {
    setOpenModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setOpenModal(false);
  }, []);

  const handleSave = useCallback(
    async (newSupplier) => {
      try {
        const payload = {
          name: newSupplier.name,
          is_active: true,
          budget: Number(newSupplier.budget),
          start: newSupplier.start,
          end: newSupplier.end,
          leadtimes: [],
        };

        const created = await createSupplier(payload);
        const normalizedRow = mapSupplierToGrid(created);

        setRows((prev) => [...prev, normalizedRow]);
        setOpenModal(false);
      } catch (error) {
        logger.error("Erro ao criar fornecedor:", error);
      }
    },
    [setRows]
  );

  const handleDeleteClick = useCallback(
    (id) => () => {
      if (!onRequestDelete) return;
      const targetRow = rows.find((row) => row.id === id);
      if (targetRow) onRequestDelete(targetRow);
    },
    [onRequestDelete, rows]
  );

  const handleCancelClick = useCallback(
    (id, genericHandleCancelClick) => () => {
      genericHandleCancelClick(id)();
      if (!setRows) return;
      const editedRow = rows.find((row) => row.id === id);
      if (editedRow?.isNew) {
        setRows((prevRows) => prevRows.filter((row) => row.id !== id));
      }
    },
    [rows, setRows]
  );

  const handleLeadtimeClick = useCallback(
    (id) => () => {
      const targetRow = rows.find((row) => row.id === id);
      setSelectedSupplier(targetRow || null);
      setLeadtimeModalOpen(true);
    },
    [rows]
  );

  const handleCloseLeadtimeModal = useCallback(() => {
    setLeadtimeModalOpen(false);
    setSelectedSupplier(null);
  }, []);

  const processRowUpdate = useCallback(
    async (newRow) => {
      try {
        const originalRow = rows.find((row) => row.id === newRow.id) || {};

        const rawLeadtimes =
          newRow.leadtimes && newRow.leadtimes.length
            ? newRow.leadtimes
            : originalRow.leadtimes || [];

        const normalizedLeadtimes = (rawLeadtimes || []).map((leadtime) => ({
          branch_id: leadtime.branch_id || leadtime.branchId || leadtime.id,
          leadtime:
            leadtime.leadtime != null
              ? leadtime.leadtime
              : leadtime.days != null
                ? leadtime.days
                : 0,
        }));

        const startDate = toDateOnlyString(newRow.start);
        const endDate = toDateOnlyString(newRow.end);

        if (startDate && endDate && startDate > endDate) {
          throw new Error("Data de término deve ser igual ou posterior à data de início.");
        }

        const payload = {
          name: newRow.name,
          budget: Number(newRow.budget),
          start: startDate,
          end: endDate,
          leadtimes: normalizedLeadtimes,
        };

        const updated = await updateSupplier(newRow.id, payload);
        const updatedRow = mapSupplierToGrid(updated);

        setRows((prev) =>
          prev.map((row) => (row.id === updatedRow.id ? updatedRow : row))
        );

        return updatedRow;
      } catch (error) {
        logger.error("Erro ao atualizar fornecedor:", error);
        throw error;
      }
    },
    [rows, setRows]
  );

  const handleSupplierUpdated = useCallback(
    (updated) => {
      if (!updated) return;
      const updatedRow = mapSupplierToGrid(updated);
      setRows((prev) => prev.map((row) => (row.id === updatedRow.id ? updatedRow : row)));
    },
    [setRows]
  );

  return {
    openModal,
    leadtimeModalOpen,
    selectedSupplier,
    handleAdd,
    handleCloseModal,
    handleSave,
    handleDeleteClick,
    handleCancelClick,
    handleLeadtimeClick,
    handleCloseLeadtimeModal,
    processRowUpdate,
    handleSupplierUpdated,
  };
}

export default useSuppliersTableLogic;
