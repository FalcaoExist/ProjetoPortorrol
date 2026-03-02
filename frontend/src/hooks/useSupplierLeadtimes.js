import { useState, useEffect, useCallback } from "react";
import * as supplierService from "../services/supplierService";
import dashboardService from "../services/dashboardService";

const BRANCH_NAMES = ["Porto Alegre", "Joinville", "São Paulo"];

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

      const supplierLeadtimes = targetSupplier?.leadtimes || [];
      const leadtimeMap = new Map(
        supplierLeadtimes.map((lt) => [lt.branch_id, lt.leadtime])
      );

      const allBranches = filiais || [];
      const relevantBranches = allBranches.filter(branch => 
          BRANCH_NAMES.includes(branch.nome || branch.name)
      );

      const mappedLeadtimes = relevantBranches.reduce((acc, branch) => {
        const branchName = branch.nome || branch.name;
        acc[branchName] = leadtimeMap.has(branch.id)
          ? leadtimeMap.get(branch.id)
          : 0;
        return acc;
      }, {});

      // Ensure all required branches are present in the final object
      BRANCH_NAMES.forEach(name => {
          if (!mappedLeadtimes.hasOwnProperty(name)) {
              mappedLeadtimes[name] = 0; // Default to 0 if not found
          }
      });
      
      setLeadtimes(mappedLeadtimes);
    } catch (err) {
      console.error("Erro ao buscar leadtimes do fornecedor:", err);
      setError(err);
      setLeadtimes({});
    } finally {
      setIsLoading(false);
    }
  }, [supplierName]);

  // Fetch on initial load and when supplierName changes
  useEffect(() => {
    fetchLeadtimes();
  }, [fetchLeadtimes]);

  // Re-fetch when the window gains focus to ensure data is fresh
  useEffect(() => {
    window.addEventListener('focus', fetchLeadtimes);
    return () => {
      window.removeEventListener('focus', fetchLeadtimes);
    };
  }, [fetchLeadtimes]);


  return { leadtimes, isLoading, error };
}
