//src/components/UI/Select.jsx
'use client';

import React, { forwardRef } from 'react';

const Select = forwardRef(({ label, name, value, onChange, placeholder, className = '', selectClassName = '', labelClassName = '', options = [], disabled = false, ...props }, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={name} className={`block text-sm font-normal text-baltic-black ${labelClassName}`}>
          {label}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        ref={ref}
        className={`w-full p-2 h-14 border bg-ghost-white border-gray-200 rounded-md text-base text-baltic-black focus:outline-none focus:ring-2 focus:ring-vivid-red/60 ${selectClassName}`}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});

Select.displayName = 'Select';

export default Select;