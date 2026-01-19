import React from "react";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import InputField from "../common/InputField";
import { useAddBuyerForm } from "../../hooks/useAddBuyerForm";

export default function AddBuyerModal({
  isOpen = false,
  onClose = () => {},
  onSave = async () => ({ success: true }),
  onCheckEmail = async () => ({ exists: false }),
  suppliersOptions = [],
}) {
  // Injeta as dependências e recebe estados/funções prontos
  const {
    formData,
    selectedSuppliers,
    loading,
    checkingEmail,
    status,
    handleChange,
    handleSuppliersSelect,
    handleEmailBlur,
    handleSubmit
  } = useAddBuyerForm({ isOpen, onSave, onCheckEmail, onClose });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 font-poppins">Novo Comprador</h2>
        </div>

        {status.message && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center gap-3 text-sm font-medium font-poppins ${
              status.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {status.type === "success" ? <FiCheckCircle size={20} /> : <FiAlertCircle size={20} />}
            <span>{status.message}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <InputField
            label="Nome"
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            placeholder="Ex: João Silva"
            required
            disabled={loading}
          />
          <InputField
            label="E-mail"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleEmailBlur}
            placeholder="Ex: joao@empresa.com"
            required
            disabled={loading || checkingEmail}
          />

          {/* CAMPO DE SELEÇÃO MÚLTIPLA */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600 font-poppins">Fornecedores</label>
            <select
              multiple
              value={selectedSuppliers}
              onChange={handleSuppliersSelect}
              disabled={loading}
              className="border border-gray-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-gray-400 h-32 text-sm font-poppins bg-white"
            >
              {suppliersOptions.length > 0 ? (
                suppliersOptions.map((opt) => (
                  <option key={opt} value={opt} className="p-1">
                    {opt}
                  </option>
                ))
              ) : (
                <option disabled className="text-gray-400 p-1">Nenhum fornecedor disponível</option>
              )}
            </select>
            <span className="text-xs text-gray-400 font-poppins mt-1">
              Segure <strong>Ctrl</strong> ou <strong>Cmd</strong> para selecionar vários.
            </span>
          </div>

          <InputField
            label="Senha de Acesso"
            type="password"
            name="senha"
            value={formData.senha}
            onChange={handleChange}
            placeholder="********"
            required
            disabled={loading}
          />

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => typeof onClose === "function" && onClose()}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50 font-poppins"
            >
              Cancelar
            </button>

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || status.type === "success" || checkingEmail}
              className={`px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all flex items-center gap-2 font-poppins
                ${status.type === "success" ? "bg-green-600 hover:bg-green-700" : "bg-[#f43629] hover:bg-white hover:text-black"} disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {loading ? "Salvando..." : status.type === "success" ? "Salvo!" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}