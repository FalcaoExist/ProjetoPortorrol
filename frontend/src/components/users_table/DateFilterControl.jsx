import React from 'react';

export default function DateFilterControl({ value = {}, onChange }) {
  const handleDateChange = (part) => (event) => {
    // Cria um novo objeto para garantir a re-renderização
    const newValue = { ...value, [part]: event.target.value };
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <div>
        <label htmlFor="date-from" className="block text-xs text-gray-600">De</label>
        <input
          type="date"
          id="date-from"
          value={value.from || ''}
          onChange={handleDateChange('from')}
          className="w-full rounded border border-[#e5e7eb] px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-[#111827]"
        />
      </div>
      <div>
        <label htmlFor="date-to" className="block text-xs text-gray-600">Até</label>
        <input
          type="date"
          id="date-to"
          value={value.to || ''}
          onChange={handleDateChange('to')}
          className="w-full rounded border border-[#e5e7eb] px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-[#111827]"
        />
      </div>
    </div>
  );
}
