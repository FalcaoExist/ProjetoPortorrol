import { useState, useEffect, useCallback } from "react";
import * as supplierService from "../services/supplierService";
import dashboardService from "../services/dashboardService";
import { logger } from "../utils/logger";

export function useSupplierLeadtimes(supplierName) {
  const [leadtimes, setLeadtimes] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeadtimes = useCallback(async () => {
    if (!supplierName) {
      setLeadtimes({});
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [filiais, suppliers] = await Promise.all([
        dashboardService.getFiliais(),
        supplierService.getSuppliers(),
      ]);

      const targetSupplier = suppliers.find(s => (s.name || s.nome) === supplierName);

      const mappedLeadtimes = supplierService.buildSupplierLeadtimeMap(
        filiais || [],
        targetSupplier?.leadtimes || [],
        supplierService.DEFAULT_BRANCH_NAMES
      );
      
      setLeadtimes(mappedLeadtimes);
    } catch (err) {
      logger.error("Erro ao buscar leadtimes do fornecedor:", err);
      setError(err);
      setLeadtimes({});
    } finally {
      setIsLoading(false);
    }
  }, [supplierName]);

  useEffect(() => {
    fetchLeadtimes();
  }, [fetchLeadtimes]);

  // Mantém os leadtimes sincronizados ao retornar para a aba.
  useEffect(() => {
    window.addEventListener('focus', fetchLeadtimes);
    return () => {
      window.removeEventListener('focus', fetchLeadtimes);
    };
  }, [fetchLeadtimes]);

  return { leadtimes, isLoading, error };
}
