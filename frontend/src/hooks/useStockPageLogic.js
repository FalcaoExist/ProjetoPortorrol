import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useStock } from "./useStock";
import { importStockFromFile, STOCK_STATUS_OPTIONS } from "../services/stockService";
import { logger } from "../utils/logger";

export function useStockPageLogic() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isConfirmOrderModalOpen, setIsConfirmOrderModalOpen] = useState(false);
  const [isImportConfirmModalOpen, setIsImportConfirmModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const stock = useStock();
  const {
    setSearchQuery,
    setStatusFilter,
    setFornecedor,
    setFilial,
    setUnidadesPendentesFiltro,
    handleCreateOrder,
  } = stock;

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sku = params.get("sku");
      const status = params.get("status");
      const supplier = params.get("supplier");
      const branch = params.get("branch");
      const pendingUnits = params.get("pendingUnits");

      if (sku) setSearchQuery(decodeURIComponent(sku));

      if (status) {
        const raw = decodeURIComponent(status);
        const matched = STOCK_STATUS_OPTIONS.find((option) => option.toLowerCase() === raw.toLowerCase());
        setStatusFilter(matched || raw);
      }

      if (supplier) setFornecedor(decodeURIComponent(supplier));
      if (branch) setFilial(decodeURIComponent(branch));
      if (pendingUnits === "zero") setUnidadesPendentesFiltro(0);
    } catch {}
  }, [setFilial, setFornecedor, setSearchQuery, setStatusFilter, setUnidadesPendentesFiltro]);

  const handleImportClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsImportConfirmModalOpen(true);
    }
    event.target.value = "";
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!selectedFile) return;

    try {
      await importStockFromFile(selectedFile);
    } catch (error) {
      logger.error("Erro ao importar arquivo:", error);
    } finally {
      setSelectedFile(null);
      setIsImportConfirmModalOpen(false);
    }
  }, [selectedFile]);

  const handleConfirmCreateOrder = useCallback(() => {
    return handleCreateOrder(navigate);
  }, [handleCreateOrder, navigate]);

  return {
    statusOptions: STOCK_STATUS_OPTIONS,
    fileInputRef,
    stock,
    selectedFile,
    isImportConfirmModalOpen,
    setIsImportConfirmModalOpen,
    isConfirmOrderModalOpen,
    setIsConfirmOrderModalOpen,
    handleImportClick,
    handleFileChange,
    handleConfirmImport,
    handleConfirmCreateOrder,
  };
}

export default useStockPageLogic;
