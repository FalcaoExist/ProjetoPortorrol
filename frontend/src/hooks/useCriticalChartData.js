import { useEffect, useMemo, useState } from "react";

import dashboardService from "../services/dashboardService";
import { logger } from "../utils/logger";

export function useCriticalChartData({ data = [], supplier, showOnlyWithoutPending }) {
  const [filteredCriticalData, setFilteredCriticalData] = useState([]);
  const [loadingFilteredCriticalData, setLoadingFilteredCriticalData] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadFilteredCriticalData = async () => {
      if (!showOnlyWithoutPending) return;

      setLoadingFilteredCriticalData(true);
      try {
        const mapped = await dashboardService.getFormattedCriticalItems(20, supplier, true);
        if (isMounted) {
          setFilteredCriticalData(mapped);
        }
      } catch (error) {
        logger.error("Erro ao carregar SKUs críticos sem pendências:", error);
        if (isMounted) {
          setFilteredCriticalData([]);
        }
      } finally {
        if (isMounted) {
          setLoadingFilteredCriticalData(false);
        }
      }
    };

    loadFilteredCriticalData();

    return () => {
      isMounted = false;
    };
  }, [showOnlyWithoutPending, supplier]);

  const sourceData = showOnlyWithoutPending ? filteredCriticalData : data;
  const hasData = Array.isArray(sourceData) && sourceData.length > 0;

  const chartData = useMemo(() => {
    if (!hasData) return [];

    const isAllSuppliers = !supplier || supplier === "Todos";

    return sourceData.map((row) => {
      const supplierName = row.supplier_name || row.fornecedor || row.primary_supplier || row.suppliers?.name || "";
      const unidadesPendentes = Number(row.unidades_pendentes || row.pedidos_pendentes || 0);
      const hasPendencia = unidadesPendentes > 0;
      const nomeProduto = row.nome_produto || row.name || row.item || "";
      const baseDisplayName = isAllSuppliers && supplierName ? `${nomeProduto} - ${supplierName}` : nomeProduto;

      return {
        ...row,
        nome_produto: nomeProduto,
        skuName: nomeProduto,
        displayName: baseDisplayName,
        displayNameWithIcon: hasPendencia ? `🚚 ${baseDisplayName}` : baseDisplayName,
        unidades_pendentes: unidadesPendentes,
      };
    });
  }, [hasData, sourceData, supplier]);

  return {
    chartData,
    hasData,
    loadingFilteredCriticalData,
  };
}

export default useCriticalChartData;
