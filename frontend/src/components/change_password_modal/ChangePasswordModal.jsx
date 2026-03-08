import React, { useState, useEffect, useRef } from "react";
import { FiLock, FiX, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import InputField from "../common/InputField";
import { logger } from "../../utils/logger";

/**
 * Modal para alteração de senha de um usuário específico.
 */
export default function ChangePasswordModal({ isOpen, onClose, onSave, userName }) {
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "idle", message: "" });
    const timeoutRef = useRef(null);

    // Reseta o estado quando o modal abre/fecha
    useEffect(() => {
        if (isOpen) {
            setNewPassword("");
            setLoading(false);
            setStatus({ type: "idle", message: "" });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        }
    }, [isOpen]);

    useEffect(() => () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 3) {
            setStatus({ type: "error", message: "A senha deve ter pelo menos 3 caracteres." });
            return;
        }

        setLoading(true);
        setStatus({ type: "idle", message: "" });
        try {
            const result = await onSave(newPassword);
            if (result?.success) {
                setStatus({ type: "success", message: result.message || "Senha alterada com sucesso!" });
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                timeoutRef.current = setTimeout(() => {
                    onClose();
                }, 3000);
            } else {
                setStatus({ type: "error", message: result?.message || "Não foi possível alterar a senha." });
            }
        } catch (error) {
            logger.error("Erro ao salvar senha:", error);
            setStatus({ type: "error", message: error?.message || "Erro inesperado ao alterar a senha." });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        onClose();
    };

    const isSuccess = status.type === "success";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in relative">
                <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <FiX size={24} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-purple-100 p-3 rounded-full text-[#5A44B0]">
                        <FiLock size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 font-poppins">Alterar Senha</h2>
                        <p className="text-sm text-gray-500 font-poppins">Usuário: <span className="font-semibold">{userName}</span></p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <InputField
                        label="Nova Senha"
                        type="password"
                        name="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Digite a nova senha"
                        required
                        disabled={loading || isSuccess}
                    />

                    {status.message && (
                        <div
                            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium font-poppins ${
                                status.type === "success"
                                    ? "bg-green-50 border-green-200 text-green-700"
                                    : "bg-red-50 border-red-200 text-red-700"
                            }`}
                        >
                            {status.type === "success" ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
                            <span>{status.message}</span>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 font-poppins transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={`px-4 py-2 rounded-xl text-white font-medium font-poppins transition-colors shadow-md ${
                                isSuccess
                                    ? "bg-green-600 hover:bg-green-700 disabled:bg-green-600 disabled:text-white"
                                    : "bg-[#5A44B0] hover:bg-[#4a3794] disabled:bg-[#5A44B0]/80"
                            }`}
                            disabled={loading || isSuccess}
                        >
                            {loading ? "Salvando..." : isSuccess ? "Senha salva" : "Salvar Senha"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}