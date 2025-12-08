import React from 'react';

const InputField = ({ label, type, name, value, onChange, placeholder, disabled = false }) => {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm text-gray-600">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`border border-gray-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-gray-400 ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
      />
    </div>
  );
};

export default InputField;
