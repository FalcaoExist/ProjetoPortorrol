import { useState, useEffect } from "react";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function useAddBuyerForm({ isOpen, onSave, onCheckEmail, onClose }) {
  const initialFormState = { nome: "", email: "", senha: "" };
  
  // Estados
  const [formData, setFormData] = useState(initialFormState);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setStatus({ type: "", message: "" });
      setFormData(initialFormState);
      setEmailExists(false);
      setSelectedSuppliers([]);
    }
  }, [isOpen]);

  // Handlers de Input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (status.type === "error") setStatus({ type: "", message: "" });
    if (name === "email") setEmailExists(false);
  };

  const handleSuppliersSelect = (e) => {
    const options = Array.from(e.target.selectedOptions || []);
    const vals = options.map((o) => o.value);
    setSelectedSuppliers(vals);
  };

  // Validações
  const handleEmailBlur = async () => {
    const email = formData.email?.trim();
    if (!email || !isValidEmail(email)) return;

    try {
      setCheckingEmail(true);
      const res = await onCheckEmail(email);
      const exists =
        res?.exists === true ||
        res?.code === "EMAIL_EXISTS" ||
        (res?.message || "").toLowerCase().includes("já");

      if (exists) {
        setEmailExists(true);
        setStatus({ type: "error", message: "E-mail já cadastrado." });
      } else {
        if (status.type === "error") setStatus({ type: "", message: "" });
        setEmailExists(false);
      }
    } catch (err) {
      console.error("Erro ao checar e-mail:", err);
    } finally {
      setCheckingEmail(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.nome.trim()) errors.push("Nome");
    if (!formData.email.trim()) errors.push("E-mail");
    else if (!isValidEmail(formData.email)) errors.push("E-mail inválido");
    
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

  // Envio
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const payload = {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        supplier: selectedSuppliers,
      };

      const result = await onSave(payload);

      if (result && result.success) {
        setStatus({ type: "success", message: "Usuário cadastrado com sucesso!" });
        if (typeof onClose === "function") {
          setTimeout(() => onClose(), 2000);
        }
      } else {
        if (result?.code === "EMAIL_EXISTS" || (result?.message || "").toLowerCase().includes("já")) {
          setEmailExists(true);
          setStatus({ type: "error", message: "E-mail já cadastrado." });
        } else {
          setStatus({ type: "error", message: (result && result.message) || "Erro ao salvar." });
        }
      }
    } catch (error) {
      console.error("Erro no submit:", error);
      setStatus({ type: "error", message: "Erro de conexão." });
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    selectedSuppliers,
    loading,
    checkingEmail,
    status,
    handleChange,
    handleSuppliersSelect,
    handleEmailBlur,
    handleSubmit
  };
}