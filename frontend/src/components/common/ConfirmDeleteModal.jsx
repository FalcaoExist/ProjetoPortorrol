import { useEffect, useRef, useState } from "react";
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";


export default function ConfirmDeleteModal({
  isOpen = false,
  title = "Confirmar exclusão",
  entityLabel = "este item",
  confirmationKeyword = "CONFIRMO",
  successMessage = "Item excluído com sucesso!",
  description,
  onConfirm = async () => ({ success: false }),
  onClose = () => {},
}) {
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);

  const normalizedKeyword = confirmationKeyword.trim();
  const trimmedInput = inputValue.trim();
  const matchesKeyword = trimmedInput === normalizedKeyword;
  const confirmDisabled = loading || status.type === "success" || !matchesKeyword;

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (isOpen) {
      setInputValue("");
      setStatus({ type: "idle", message: "" });
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (confirmDisabled) return;
    setLoading(true);
    setStatus({ type: "idle", message: "" });

    try {
      const result = await onConfirm();
      if (result?.success) {
        setStatus({ type: "success", message: result.message || successMessage });
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          onClose();
        }, 4000);
      } else {
        setStatus({
          type: "error",
          message: result?.message || "Não foi possível concluir a exclusão.",
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: error?.message || "Ocorreu um erro inesperado ao excluir.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 space-y-6 font-poppins animate-fade-in">
        <div className="flex items-start gap-4">
          <span className="p-3 rounded-full bg-red-100 text-red-500">
            <FiAlertTriangle size={22} />
          </span>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {description ?? (
                <>
                  Esta ação não pode ser desfeita. Ao confirmar, {entityLabel} será removido
                  permanentemente.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 text-sm text-gray-600">
          <p className="font-medium text-gray-700">
            Para excluir {entityLabel}, digite <span className="font-semibold">{normalizedKeyword}</span> abaixo.
          </p>
          <input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={normalizedKeyword}
            disabled={loading || status.type === "success"}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#5A44B0] text-base"
          />
          <p className="text-xs text-gray-500">Use exatamente o texto em caixa alta informado.</p>
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

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-60"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmDisabled}
            className={`px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all ${
              status.type === "success"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700 disabled:opacity-60"
            }`}
          >
            {loading ? "Excluindo..." : status.type === "success" ? "Excluído" : "Confirmar exclusão"}
          </button>
        </div>
      </div>
    </div>
  );
}
