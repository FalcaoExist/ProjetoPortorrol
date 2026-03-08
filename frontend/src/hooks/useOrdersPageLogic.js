import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ordersService from "../services/ordersService";
import { logger } from "../utils/logger";

const buildOrdersExportRows = (orders = []) => {
  const rows = [];
  rows.push([
    "Número do Pedido",
    "Data do Pedido",
    "Status",
    "Item",
    "Fornecedor",
    "Quantidade",
    "Valor",
    "Filial",
    "Previsão Entrega",
    "Data Entrega",
  ]);

  (orders || []).forEach((order) => {
    order.items.forEach((item) => {
      rows.push([
        order.numero_pedido,
        order.data_pedido,
        order.status,
        item.item,
        item.fornecedor,
        item.quantidade,
        item.valor,
        item.filial,
        item.previsao_entrega,
        item.data_entrega || "",
      ]);
    });
    rows.push([]);
  });

  return rows;
};

export function useOrdersPageLogic({
  setStatusFilter,
  setFornecedorFilter,
  groupedAndFilteredOrders,
  showReminder,
  dismissReminder,
  onImportSuccess,
}) {
  const fileInputRef = useRef(null);
  const [searchParams] = useSearchParams();

  const [isImportConfirmModalOpen, setIsImportConfirmModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const maxImportFileSize =
    (Number(import.meta.env.VITE_MAX_IMPORT_FILE_SIZE_MB) || 100) * 1024 * 1024;

  useEffect(() => {
    if (showReminder) {
      dismissReminder();
    }
  }, [dismissReminder, showReminder]);

  useEffect(() => {
    const statusFromParams = searchParams.get("status");
    const supplierFromParams = searchParams.get("fornecedor");

    if (statusFromParams) {
      setStatusFilter(statusFromParams);
    }

    if (supplierFromParams) {
      setFornecedorFilter(supplierFromParams);
    }
  }, [searchParams, setFornecedorFilter, setStatusFilter]);

  const exportRows = useMemo(
    () => buildOrdersExportRows(groupedAndFilteredOrders),
    [groupedAndFilteredOrders]
  );

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size && file.size > maxImportFileSize) {
        logger.warn(
          `Arquivo de importação excede o limite de ${Math.round(maxImportFileSize / 1024 / 1024)} MB.`
        );
      } else {
        setSelectedFile(file);
        setIsImportConfirmModalOpen(true);
      }

      event.target.value = "";
    },
    [maxImportFileSize]
  );

  const handleConfirmImport = useCallback(async () => {
    if (!selectedFile) {
      return { success: false, message: "Nenhum arquivo selecionado para importação." };
    }

    try {
      await ordersService.importOrdersFromFile(selectedFile);
      if (typeof onImportSuccess === "function") {
        await onImportSuccess();
      }
      return { success: true, message: "Pedidos importados com sucesso." };
    } catch (error) {
      logger.error("Erro ao importar arquivo:", error);
      return { success: false, message: error?.message || "Erro ao importar pedidos." };
    } finally {
      setSelectedFile(null);
      setIsImportConfirmModalOpen(false);
    }
  }, [onImportSuccess, selectedFile]);

  const closeImportModal = useCallback(() => {
    setSelectedFile(null);
    setIsImportConfirmModalOpen(false);
  }, []);

  return {
    fileInputRef,
    selectedFile,
    isImportConfirmModalOpen,
    exportRows,
    handleImportClick,
    handleFileChange,
    handleConfirmImport,
    closeImportModal,
  };
}

export default useOrdersPageLogic;
