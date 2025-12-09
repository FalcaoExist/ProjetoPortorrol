// frontend/src/components/common/SelectFilter.jsx
import React from 'react';

/**
 * Um componente de filtro de seleção reutilizável.
 *
 * @param {object} props - As propriedades do componente.
 * @param {string} props.label - O rótulo para o campo de seleção.
 * @param {string} props.name - O nome do campo de seleção.
 * @param {string} props.value - O valor selecionado.
 * @param {function} props.onChange - A função a ser chamada quando o valor mudar.
 * @param {Array<string>} props.options - A lista de opções para o seletor.
 */
const SelectFilter = ({ label, name, value, onChange, options }) => {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm text-gray-600">{label}</label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="border border-gray-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectFilter;
