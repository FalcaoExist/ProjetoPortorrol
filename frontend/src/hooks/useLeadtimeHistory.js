import { useCallback, useState } from "react";

// Encapsula gestão de histórico de leadtime
export const useLeadtimeHistory = (initialHistory = {}) => {
    const [history, setHistory] = useState(initialHistory);

    const registerSnapshot = useCallback((supplier, notes = "") => {
        if (!supplier?.id) {
            return { success: false, message: "Fornecedor inválido." };
        }

        const now = new Date();
        const entry = {
            id: `${supplier.id}-${now.getTime()}`,
            recordedAt: now.toISOString(),
            start: supplier.start,
            end: supplier.end,
            budget: supplier.budget,
            leadtime: supplier.leadtime,
            notes: notes || "Snapshot dos dados em vigor.",
        };

        setHistory((prev) => {
            const current = prev?.[supplier.id] || [];
            return {
                ...prev,
                [supplier.id]: [entry, ...current],
            };
        });

        return { success: true, message: "Dados atuais registrados no histórico." };
    }, []);

    const removeSupplierHistory = useCallback((supplierId) => {
        setHistory((prev) => {
            if (!prev) return prev;
            const updated = { ...prev };
            delete updated[supplierId];
            return updated;
        });
    }, []);

    return {
        history,
        registerSnapshot,
        removeSupplierHistory,
    };
};
