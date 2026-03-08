import { useEffect, useRef, useState } from "react";
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

export default function ConfirmationModal({
  isOpen = false,
  title = "Confirmar Ação",
  message = "Você tem certeza que deseja prosseguir?",
  onConfirm = () => {},
  onClose = () => {},
  confirmButtonText = "Confirmar",
  cancelButtonText = "Cancelar",
  loading = false,
  confirmButtonClassName = "px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all bg-[#5A44B0] hover:bg-[#4e3a9a] disabled:opacity-60",
  successMessage = "Ação concluída com sucesso!",
}) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const timeoutRef = useRef(null);

  const effectiveLoading = loading || internalLoading;

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setInternalLoading(false);
      setStatus({ type: "idle", message: "" });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (effectiveLoading) return;
    setInternalLoading(true);
    setStatus({ type: "idle", message: "" });

    try {
      const result = await onConfirm();

      if (result?.success) {
        setStatus({ type: "success", message: result.message || successMessage });
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setStatus({ type: "error", message: result?.message || "Não foi possível concluir a ação." });
      }
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Ocorreu um erro inesperado." });
    } finally {
      setInternalLoading(false);
    }
  };

  const handleClose = () => {
    if (effectiveLoading) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6 font-poppins animate-fade-in">
        <div className="flex items-start gap-4">
          <span className="p-3 rounded-full bg-blue-100 text-blue-500">
            <FiAlertTriangle size={22} />
          </span>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
          </div>
        </div>

        {status.message && (
          <div
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
              status.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {status.type === "success" ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={effectiveLoading}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition disabled:opacity-60"
          >
            {cancelButtonText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={effectiveLoading}
            className={`${
              status.type === "success"
                ? "px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all bg-green-600 hover:bg-green-700 disabled:opacity-60"
                : confirmButtonClassName
            }`}
          >
            {effectiveLoading ? "Processando..." : status.type === "success" ? "Concluído" : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
