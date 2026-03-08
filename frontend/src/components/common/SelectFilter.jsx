// frontend/src/components/common/SelectFilter.jsx
import React from 'react';

/**
 * Um componente de filtro de seleção reutilizável.
 *
 * @param {object} props 
 * @param {string} props.label 
 * @param {string} props.name 
 * @param {string} props.value 
 * @param {function} props.onChange 
 * @param {Array<string>} props.options 
 */
export default function SelectFilter({ label, name, value, onChange, options }){
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
        {options.map((option, idx) => (
          <option key={`${option}-${idx}`} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};
