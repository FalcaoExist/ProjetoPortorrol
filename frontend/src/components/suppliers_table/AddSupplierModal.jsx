import React, { useState, useEffect } from "react";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import InputField from "../common/InputField";

export default function AddSupplierModal({
  isOpen = false,
  onClose = () => {},
  onSave = async () => {},
}) {
  const [formData, setFormData] = useState({
    name: "",
    start: "",
    end: "",
    budget: "",
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        start: "",
        end: "",
        budget: "",
      });
      setStatus({ type: "", message: "" });
      setLoading(false);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const payload = {
        name: formData.name.trim(),
        start: formData.start, // já vem YYYY-MM-DD
        end: formData.end,
        budget: Number(formData.budget),
        leadtime: Number(formData.leadtime),
      };

      await onSave(payload);

      setStatus({
        type: "success",
        message: "Fornecedor salvo com sucesso!",
      });

      setTimeout(() => {
        onClose();
      }, 800);

    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);

      setStatus({
        type: "error",
        message:
          error?.response?.data?.detail ||
          "Erro ao salvar o fornecedor.",
      });

    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg animate-fade-in">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 font-poppins">
            Adicionar Novo Fornecedor
          </h2>
        </div>

        {status.message && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center gap-3 text-sm font-medium font-poppins ${
              status.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {status.type === "success" ? (
              <FiCheckCircle size={20} />
            ) : (
              <FiAlertCircle size={20} />
            )}
            <span>{status.message}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>

          <InputField
            label="Fornecedor"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nome do fornecedor"
            required
            disabled={loading}
          />

          <InputField
            label="Início"
            type="date"
            name="start"
            value={formData.start}
            onChange={handleChange}
            required
            disabled={loading}
          />

          <InputField
            label="Fim"
            type="date"
            name="end"
            value={formData.end}
            onChange={handleChange}
            required
            disabled={loading}
          />

          <InputField
            label="Orçamento (R$)"
            type="number"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            placeholder="0"
            required
            disabled={loading}
          />

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50 font-poppins"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || status.type === "success"}
              className={`px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all flex items-center gap-2 font-poppins
                ${status.type === "success" ? "bg-green-600 hover:bg-green-700" : "bg-[#f43629] hover:bg-[#d92e21]"} disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {loading
                ? "Salvando..."
                : status.type === "success"
                ? "Salvo!"
                : "Salvar"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}