import React, { useState, useEffect } from "react";
import { FiLock, FiX } from "react-icons/fi";
import InputField from "../common/InputField";

/**
 * Modal para alteração de senha de um usuário específico.
 */
export default function ChangePasswordModal({ isOpen, onClose, onSave, userName }) {
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Reseta o estado quando o modal abre/fecha
    useEffect(() => {
        if (isOpen) {
            setNewPassword("");
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 3) {
            alert("A senha deve ter pelo menos 3 caracteres.");
            return;
        }

        setLoading(true);
        try {
            await onSave(newPassword);
            onClose(); // Fecha o modal após sucesso
        } catch (error) {
            console.error("Erro ao salvar senha:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in relative">
                <button 
                    onClick={onClose}
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
                    />

                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 font-poppins transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-xl bg-[#5A44B0] text-white font-medium hover:bg-[#4a3794] font-poppins disabled:opacity-70 transition-colors shadow-md"
                            disabled={loading}
                        >
                            {loading ? "Salvando..." : "Salvar Senha"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}