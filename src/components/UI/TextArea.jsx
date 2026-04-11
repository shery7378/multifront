//src/components/UI/TextArea.jsx
'use client';

import React, { forwardRef } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';

const TextArea = forwardRef(({ label, name, value, onChange, placeholder, className = '', labelClassName = '', textareaClassName = '', disabled = false, rows = 4, height, error = '', ...props }, ref) => {
    const hasError = !!error;
    
    return (
        <div className={`w-full ${className} flex flex-col gap-1.5`}>
            {label && (
                <label htmlFor={name} className={`block text-sm font-medium text-baltic-black mb-1 ${labelClassName}`}>
                    {label}
                </label>
            )}
            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                ref={ref}
                rows={rows} // Dynamically set rows
                style={{ height: height || 'auto' }} // Dynamically set height
                className={`w-full p-2 border bg-ghost-white rounded-md focus:outline-none focus:ring-2 transition-all disabled:bg-gray-200 disabled:cursor-not-allowed ${
                    hasError ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-vivid-red/60'
                } ${textareaClassName}`}
                {...props}
            />
            {hasError && (
                <div className="flex items-center gap-1.5 mt-1 text-vivid-red animate-fade-in">
                    <ExclamationCircleIcon className="w-4 h-4 flex-shrink-0" />
                    <p className="text-xs font-semibold">{error}</p>
                </div>
            )}
        </div>
    );
});



TextArea.displayName = 'TextArea';

export default TextArea;

{/* Using rows prop */ }
{/* <TextArea
    label="Short Description"
    name="shortDesc"
    value={text}
    onChange={(e) => setText(e.target.value)}
    placeholder="Enter short text"
    rows={3}
    className="mt-4"
    labelClassName="text-lg"
    textareaClassName="border-2"
/> */}

{/* Using height prop */ }
{/* <TextArea
    label="Long Description"
    name="longDesc"
    value={text}
    onChange={(e) => setText(e.target.value)}
    placeholder="Enter long text"
    height="200px" // Custom height
    className="mt-4"
    labelClassName="text-lg"
    textareaClassName="border-2"
/> */}