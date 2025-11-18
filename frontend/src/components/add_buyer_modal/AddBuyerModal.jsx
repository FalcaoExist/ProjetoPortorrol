import React from "react";
import InputField from "../common/InputField";

export default function AddBuyerModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg animate-fade-in">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Cadastrar Comprador</h2>

        <form className="space-y-4">
          <InputField
            label="Nome"
            type="text"
            name="nome"
            placeholder="Digite o nome completo"
          />
          <InputField
            label="Email"
            type="email"
            name="email"
            placeholder="exemplo@email.com"
          />
          <InputField
            label="Fornecedor"
            type="text"
            name="fornecedor"
            placeholder="Nome do fornecedor"
          />
          <InputField
            label="Senha"
            type="password"
            name="senha"
            placeholder="Digite uma senha forte"
          />

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
