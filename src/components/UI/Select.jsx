//src/components/UI/Select.jsx
'use client';

import React, { forwardRef } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';

const Select = forwardRef(({ label, name, value, onChange, placeholder, className = '', selectClassName = '', labelClassName = '', options = [], disabled = false, error = '', ...props }, ref) => {
  const hasError = !!error;
  
  return (
    <div className={`w-full ${className} flex flex-col gap-1.5`}>
      {label && (
        <label htmlFor={name} className={`block text-sm font-medium text-baltic-black ${labelClassName}`}>
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
        className={`w-full p-2 h-14 border bg-ghost-white rounded-md text-base text-baltic-black focus:outline-none focus:ring-2 transition-all ${
          hasError ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-vivid-red/60'
        } ${selectClassName}`}
        {...props}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && (
        <div className="flex items-center gap-1.5 mt-1 text-vivid-red animate-fade-in">
          <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}
    </div>
  );
});



Select.displayName = 'Select';

export default Select;