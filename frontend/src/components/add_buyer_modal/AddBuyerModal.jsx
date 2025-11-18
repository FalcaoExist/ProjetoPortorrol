import React from "react";

export default function AddBuyerModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg animate-fade-in">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Cadastrar Comprador</h2>

        <form className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Nome</label>
            <input
              type="text"
              className="border border-gray-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              className="border border-gray-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Fornecedor</label>
            <input
              type="text"
              className="border border-gray-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Senha</label>
            <input
              type="password"
              className="border border-gray-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-400 text-gray-700 hover:bg-gray-200 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#5A44B0] text-white hover:bg-[#4a3794] transition shadow-md"
            >
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
