import { useCallback, useEffect, useMemo, useState } from "react";

import { updateUser } from "../services/validators/api/userService";

const defaultChangePassword = async (userId, newPassword) => {
    if (!userId) {
        throw new Error("Usuário inválido para alteração de senha.");
    }
    await updateUser(userId, { password: newPassword });
    return { success: true, message: "Senha alterada com sucesso!" };
};

export function useChangePassword({ userId, changePassword = defaultChangePassword }) {
    const [formValues, setFormValues] = useState({ newPassword: "", confirmPassword: "" });
    const [status, setStatus] = useState({ type: "idle", message: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setFormValues({ newPassword: "", confirmPassword: "" });
        setStatus({ type: "idle", message: "" });
        setLoading(false);
    }, [userId]);

    const handleFieldChange = useCallback((event) => {
        const { name, value } = event.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
        setStatus((prev) => (prev.type === "idle" ? prev : { type: "idle", message: "" }));
    }, []);

    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();

        if (!formValues.newPassword || formValues.newPassword.length < 6) {
            setStatus({ type: "error", message: "A nova senha precisa ter pelo menos 6 caracteres." });
            return;
        }

        if (formValues.newPassword !== formValues.confirmPassword) {
            setStatus({ type: "error", message: "A confirmação precisa ser igual à nova senha." });
            return;
        }

        setLoading(true);
        setStatus({ type: "idle", message: "" });

        try {
            const result = await changePassword(userId, formValues.newPassword);
            if (result?.success) {
                setStatus({ type: "success", message: result.message || "Senha alterada com sucesso." });
                setFormValues({ newPassword: "", confirmPassword: "" });
            } else {
                setStatus({ type: "error", message: result?.message || "Não foi possível alterar a senha." });
            }
        } catch (error) {
            setStatus({ type: "error", message: error?.message || "Não foi possível alterar a senha." });
        } finally {
            setLoading(false);
        }
    }, [changePassword, formValues.confirmPassword, formValues.newPassword, userId]);

    const isSuccess = useMemo(() => status.type === "success", [status.type]);

    return {
        formValues,
        status,
        loading,
        isSuccess,
        handleFieldChange,
        handleSubmit,
    };
}

export default useChangePassword;
