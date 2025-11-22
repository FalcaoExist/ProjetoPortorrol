// AddBuyerModal.jsx
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import InputField from "../common/InputField";

// Validador simples de e-mail
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function AddBuyerModal({
  isOpen = false,
  onClose = () => {},
  // onSave deve retornar { success: true } ou { success: false, code?: "...", message?: "..." }
  onSave = async () => ({ success: true }),
  // onCheckEmail (opcional): deve retornar { exists: true } ou { exists: false }
  onCheckEmail = async () => ({ exists: false }),
  // Opcional: lista de fornecedores disponíveis para seleção — array de strings ou objetos { id, name }
  suppliersOptions = [], // e.g. ["Timken","ABC"] ou [{id:"1",name:"Timken"}]
}) {
  const initialFormState = { nome: "", email: "", senha: "" };
  const [formData, setFormData] = useState(initialFormState);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]); // array de strings (nomes ou ids)
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    if (isOpen) {
      setStatus({ type: "", message: "" });
      setFormData(initialFormState);
      setEmailExists(false);
      setSelectedSuppliers([]);
    }
  }, [isOpen]);

  // Evita render se modal fechado
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // limpa erros ao editar
    if (status.type === "error") setStatus({ type: "", message: "" });
    if (name === "email") {
      setEmailExists(false);
    }
  };

  // Quando suppliersOptions estiver disponível, usamos select multiple.
  // Se não, permitimos digitar fornecedores separados por vírgula em um InputField de texto.

  const handleSuppliersSelect = (e) => {
    // <select multiple> retorna selectedOptions
    const options = Array.from(e.target.selectedOptions || []);
    const vals = options.map((o) => o.value);
    setSelectedSuppliers(vals);
  };

  const handleSuppliersFreeText = (e) => {
    // Usuário digita "Timken, ABC" -> transformamos em array
    const raw = e.target.value;
    const arr = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setSelectedSuppliers(arr);
  };

  // Verificação ao perder foco do campo de e-mail (opcional)
  const handleEmailBlur = async () => {
    const email = formData.email?.trim();
    if (!email || !isValidEmail(email)) return;

    try {
      setCheckingEmail(true);
      const res = await onCheckEmail(email);
      // aceita várias formas de resposta: { exists: true/false } ou { code: "EMAIL_EXISTS" }
      const exists =
        res?.exists === true ||
        res?.code === "EMAIL_EXISTS" ||
        (res?.message || "").toLowerCase().includes("já") ||
        false;

      if (exists) {
        setEmailExists(true);
        setStatus({ type: "error", message: "E-mail já cadastrado." });
      } else {
        // limpa status se existia erro de e-mail
        if (status.type === "error") setStatus({ type: "", message: "" });
        setEmailExists(false);
      }
    } catch (err) {
      // não bloqueia o formulário se verificação falhar; apenas loga
      console.error("Erro ao checar e-mail:", err);
    } finally {
      setCheckingEmail(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.nome.trim()) errors.push("Nome");
    if (!formData.email.trim()) errors.push("E-mail");
    else if (!isValidEmail(formData.email)) errors.push("E-mail válido (ex: joao@empresa.com)");
    if (selectedSuppliers.length === 0) errors.push("Fornecedor (pelo menos 1)");
    if (!formData.senha.trim()) errors.push("Senha");
    if (errors.length) {
      setStatus({ type: "error", message: `Preencha: ${errors.join(", ")}.` });
      return false;
    }
    if (emailExists) {
      setStatus({ type: "error", message: "E-mail já cadastrado." });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setStatus({ type: "", message: "" });

    // Prepara payload: envia supplier como array
    const payload = {
      nome: formData.nome,
      email: formData.email,
      senha: formData.senha,
      // backend espera `supplier` (lista). Ajuste chaves conforme seu mapping real:
      supplier: selectedSuppliers,
    };

    try {
      const result = await onSave({
        nome: payload.nome,
        email: payload.email,
        senha: payload.senha,
        fornecedor: payload.supplier, // mantém compatibilidade com código existente (se onSave esperar fornecedor)
      });

      if (result && result.success) {
        setStatus({ type: "success", message: "Usuário cadastrado com sucesso!" });
        if (typeof onClose === "function") {
          setTimeout(() => onClose(), 2000);
        }
      } else {
        // Tratamento específico para e-mail já existente (backend)
        if (
          result?.code === "EMAIL_EXISTS" ||
          (result?.message || "").toLowerCase().includes("já")
        ) {
          setEmailExists(true);
          setStatus({ type: "error", message: "E-mail já cadastrado." });
        } else {
          setStatus({ type: "error", message: (result && result.message) || "Erro ao salvar." });
        }
      }
    } catch (error) {
      console.error("Erro no submit:", error);
      setStatus({
        type: "error",
        message: error?.name === "TypeError" ? "Erro de conexão." : "Erro inesperado."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 font-poppins">Novo Comprador</h2>
        </div>

        {status.message && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${
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

          {/* Se houver opções de fornecedores, usamos select multiple */}
          {Array.isArray(suppliersOptions) && suppliersOptions.length > 0 ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor(s)</label>
              <select
                multiple
                value={selectedSuppliers}
                onChange={handleSuppliersSelect}
                disabled={loading}
                className="w-full border rounded p-2"
              >
                {suppliersOptions.map((opt) =>
                  typeof opt === "string" ? (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ) : (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  )
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">Segure Ctrl/Cmd para selecionar múltiplos.</p>
            </div>
          ) : (
            // fallback: input free-text com vírgulas
            <InputField
              label="Fornecedor(s) (separe por vírgula)"
              type="text"
              name="fornecedor_free"
              value={selectedSuppliers.join(", ")}
              onChange={handleSuppliersFreeText}
              placeholder="Ex: Timken, ABC"
              disabled={loading}
            />
          )}

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
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || status.type === "success" || checkingEmail}
              className={`px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all flex items-center gap-2
                ${status.type === "success" ? "bg-green-600 hover:bg-green-700" : "bg-[#5A44B0] hover:bg-[#4a3794] hover:shadow-xl"} disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {loading ? "Salvando..." : status.type === "success" ? "Salvo!" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

AddBuyerModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  onCheckEmail: PropTypes.func,
  suppliersOptions: PropTypes.array,
};