// frontend/src/components/common/SearchBar.jsx
import React from 'react';

/**
 * Um componente de barra de busca reutilizável.
 *
 * @param {object} props 
 * @param {string} props.value 
 * @param {function} props.onChange 
 * @param {string} props.placeholder 
 */
export default function SearchBar({ value, onChange, placeholder }){
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="search" className="text-sm text-gray-600">Busca</label>
      <input
        id="search"
        name="search"
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="border border-gray-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
      />
    </div>
  );
};

