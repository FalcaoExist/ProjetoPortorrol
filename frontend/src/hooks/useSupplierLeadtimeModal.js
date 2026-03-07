import { useCallback, useEffect, useState } from "react";

import dashboardService from "../services/dashboardService";
import {
  buildSupplierLeadtimeRows,
  getSupplierById,
  getSupplierHistory,
  mapSupplierHistoryRow,
  toDateOnlyString,
  updateSupplier,
} from "../services/supplierService";
import { logger } from "../utils/logger";

export function useSupplierLeadtimeModal({ isOpen, supplier, onUpdateSupplier }) {
  const [branchLeadtimes, setBranchLeadtimes] = useState([]);
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [tempLeadtime, setTempLeadtime] = useState("");
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = useCallback(async (supplierId) => {
    if (!supplierId) return;
    setHistoryLoading(true);

    try {
      const data = await getSupplierHistory(supplierId);
      setHistoryRows((data || []).map(mapSupplierHistoryRow));
    } catch (error) {
      logger.error("Erro ao buscar histórico:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supplier || !isOpen) return;

    const initialize = async () => {
      setHistoryLoading(true);

      try {
        const [branches, freshSupplier] = await Promise.all([
          dashboardService.getFiliais(),
          getSupplierById(supplier.id),
        ]);

        const mappedBranches = buildSupplierLeadtimeRows(
          branches || [],
          freshSupplier?.leadtimes || []
        );

        setBranchLeadtimes(mappedBranches);
        await fetchHistory(freshSupplier?.supplier_id || freshSupplier?.id || supplier.id);
      } catch (error) {
        logger.error("Erro ao inicializar modal de leadtimes:", error);
      } finally {
        setHistoryLoading(false);
      }
    };

    initialize();
  }, [fetchHistory, isOpen, supplier]);

  useEffect(() => {
    if (isOpen) return;
    setBranchLeadtimes([]);
    setHistoryRows([]);
    setEditingBranchId(null);
    setTempLeadtime("");
    setHistoryLoading(false);
  }, [isOpen]);

  const handleEdit = useCallback((branch) => {
    setEditingBranchId(branch.id);
    setTempLeadtime(branch.days);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingBranchId(null);
    setTempLeadtime("");
  }, []);

  const handleSave = useCallback(async (branchId) => {
    if (!supplier?.id) return;

    const updatedLeadtimes = branchLeadtimes.map((branch) =>
      branch.id === branchId ? { ...branch, days: Number(tempLeadtime) } : branch
    );

    try {
      const startDate = toDateOnlyString(supplier.start);
      const endDate = toDateOnlyString(supplier.end);

      if (startDate && endDate && startDate > endDate) {
        throw new Error("Data de término deve ser igual ou posterior à data de início.");
      }

      const payload = {
        name: supplier.name,
        budget: supplier.budget,
        start: startDate,
        end: endDate,
        leadtimes: updatedLeadtimes.map((branch) => ({
          branch_id: branch.branch_id,
          leadtime: branch.days,
        })),
      };

      const updatedSupplier = await updateSupplier(supplier.id, payload);
      onUpdateSupplier(updatedSupplier);
      setBranchLeadtimes(updatedLeadtimes);
      await fetchHistory(supplier.id);
      setEditingBranchId(null);
      setTempLeadtime("");
    } catch (error) {
      logger.error("Erro ao atualizar leadtime:", error);
    }
  }, [branchLeadtimes, fetchHistory, onUpdateSupplier, supplier, tempLeadtime]);

  return {
    branchLeadtimes,
    editingBranchId,
    tempLeadtime,
    historyRows,
    historyLoading,
    setTempLeadtime,
    handleEdit,
    handleCancelEdit,
    handleSave,
  };
}

export default useSupplierLeadtimeModal;
