import { FiAlertTriangle } from "react-icons/fi";

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
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
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
            <p className="text-sm text-gray-600 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition disabled:opacity-60"
          >
            {cancelButtonText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={confirmButtonClassName}
          >
            {loading ? "Processando..." : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
}
