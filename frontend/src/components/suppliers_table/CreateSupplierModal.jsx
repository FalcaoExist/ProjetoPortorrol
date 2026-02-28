import React, { useState } from "react";
import supplierService from "../../services/supplierService"; // Ajuste o caminho se necessário
import { logger } from "../../utils/logger";
import { X } from "lucide-react"; // Ou use o ícone que você já tem

export default function CreateSupplierModal({ isOpen, onClose, onRefresh }) {
  // 1. Estado do Formulário (Incluindo o novo lead_time_days)
  const [formData, setFormData] = useState({
    name: "",
    lead_time_days: 30, // Valor padrão de 30 dias
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Se o modal não estiver aberto, não renderiza nada
  if (!isOpen) return null;

  // Função de Envio
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Chama o serviço (que bate no backend Python)
      await supplierService.createSupplier(formData);
      
      // Sucesso: Atualiza a lista e fecha o modal
      if (onRefresh) onRefresh();
      onClose();
      
      // Limpa o form
      setFormData({ name: "", lead_time_days: 30, is_active: true });
    } catch (err) {
      logger.error(err);
      setError("Erro ao criar fornecedor. Verifique se o nome já existe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Novo Fornecedor</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
            {error}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          
          {/* Campo: Nome do Fornecedor */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Fornecedor
            </label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: NSK Brasil"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* --- NOVO CAMPO: LEAD TIME (AQUI ESTÁ A MUDANÇA) --- */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lead Time Médio (Dias)
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="1"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                placeholder="Ex: 30"
                value={formData.lead_time_days}
                onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
              />
              <span className="absolute right-3 top-2 text-gray-400 text-sm">dias</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Prazo médio de entrega para cálculo de cobertura de estoque.
            </p>
          </div>
          {/* --------------------------------------------------- */}

          {/* Rodapé / Botões */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar Fornecedor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}