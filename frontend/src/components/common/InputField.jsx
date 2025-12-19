import React from 'react';

const InputField = ({
  label,
  type,
  name,
  value,
  onChange,
  placeholder,
  disabled = false,
  rightIcon = null,
  onIconClick = null,
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm text-gray-600">{label}</label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`border border-gray-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-gray-400 w-full ${rightIcon ? 'pr-10' : ''} ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
        />
        {rightIcon ? (
          <button
            type="button"
            onClick={onIconClick}
            tabIndex={-1}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary transition-colors"
          >
            {rightIcon}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default InputField;
