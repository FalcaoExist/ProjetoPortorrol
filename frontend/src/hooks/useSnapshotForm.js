import { useCallback, useEffect, useState } from "react";

// Encapsula estado/fluxo de registro do leadtime mensal de fornecedor
export const useSnapshotForm = ({ onSubmit, isOpen }) => {
    const [notes, setNotes] = useState("");
    const [status, setStatus] = useState({ type: "", message: "" });

    useEffect(() => {
        if (!isOpen) {
            setNotes("");
            setStatus({ type: "", message: "" });
        }
    }, [isOpen]);

    const handleRegister = useCallback(async (supplier) => {
        if (!supplier?.id || !onSubmit) return;
        setStatus({ type: "", message: "" });
        try {
            const result = await onSubmit(supplier, notes);
            if (result?.success) {
                setStatus({ type: "success", message: result.message || "Dados atuais registrados." });
            } else {
                setStatus({ type: "error", message: result?.message || "Não foi possível registrar." });
            }
        } catch (error) {
            setStatus({ type: "error", message: "Erro ao registrar dados atuais." });
        }
    }, [notes, onSubmit]);

    return {
        notes,
        setNotes,
        status,
        handleRegister,
    };
};
