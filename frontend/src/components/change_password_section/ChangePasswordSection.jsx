import React, { useState } from "react";
import { FiLock, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import { BsEye, BsEyeSlash } from "react-icons/bs";

import InputField from "../common/InputField";
import { useChangePassword } from "../../hooks/useChangePassword";

export default function ChangePasswordSection({ userId, userName }) {
    const { formValues, status, loading, isSuccess, handleFieldChange, handleSubmit } = useChangePassword({ userId });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    if (!userId) {
        return null;
    }

    return (
        <section className="px-8 md:px-12 pb-12">
            <div className="max-w-xl bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <header className="flex items-center gap-3 mb-6">
                    <div className="bg-purple-100 text-[#5A44B0] rounded-full p-3">
                        <FiLock size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 font-poppins">Atualizar senha</h2>
                        <p className="text-sm text-gray-500 font-poppins">{userName ? `Usuário: ${userName}` : ""}</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <InputField
                        label="Nova senha"
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={formValues.newPassword}
                        onChange={handleFieldChange}
                        placeholder="Digite a nova senha"
                        disabled={loading || isSuccess}
                        rightIcon={showNewPassword ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
                        onIconClick={() => setShowNewPassword((s) => !s)}
                    />

                    <InputField
                        label="Confirmar nova senha"
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formValues.confirmPassword}
                        onChange={handleFieldChange}
                        placeholder="Repita a nova senha"
                        disabled={loading || isSuccess}
                        rightIcon={showConfirmPassword ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
                        onIconClick={() => setShowConfirmPassword((s) => !s)}
                    />

                    {status.message ? (
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
                    ) : null}

                    <div className="flex justify-end pt-3 border-t border-gray-100">
                        <button
                            type="submit"
                            className={`px-4 py-2 rounded-xl text-white font-medium font-poppins transition-colors shadow-md ${
                                isSuccess
                                    ? "bg-green-600 hover:bg-green-700 disabled:bg-green-600 disabled:text-white"
                                    : "bg-[#5A44B0] hover:bg-[#4a3794] disabled:bg-[#5A44B0]/80"
                            }`}
                            disabled={loading || isSuccess}
                        >
                            {loading ? "Salvando..." : isSuccess ? "Senha atualizada" : "Salvar nova senha"}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}
