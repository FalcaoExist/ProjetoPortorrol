import React from 'react';

export default function DateFilter({ label, name, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm text-gray-600">{label}</label>
      <input
        id={name}
        name={name}
        type="date"
        value={value}
        onChange={onChange}
        className="border border-gray-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm font-poppins bg-white"
      />
    </div>
  );
}
