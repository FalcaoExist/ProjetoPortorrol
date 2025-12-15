import React from "react";

export default function Filter({ label, options = [], value, onChange, className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <label className="text-sm text-gray-600">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="border rounded-md px-3 py-1 bg-white"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
