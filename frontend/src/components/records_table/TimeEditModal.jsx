import { useState } from "react";
import { FiClock } from "react-icons/fi";

export default function TimeEditModal({
  isOpen = false,
  title = "Configurar novo horário de importação",
  onSave = () => {},
  onClose = () => {},
  initialTime = "05:00",
}) {
  
  const [time, setTime] = useState(initialTime);
  
  if (!isOpen) return null;

  const handleSave = () => {
    onSave(time);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6 font-poppins animate-fade-in">
        <div className="flex items-start gap-4">
          <span className="p-3 rounded-full bg-blue-100 text-blue-500">
            <FiClock size={22} />
          </span>
          <div className="space-y-2 w-full">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <div className="pt-4">
              <label htmlFor="time-input" className="block text-sm font-medium text-gray-700 mb-1">
                Novo horário (formato 24h)
              </label>
              <input
                id="time-input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl text-white font-medium shadow-lg transition-all bg-[#5A44B0] hover:bg-[#4e3a9a]"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}