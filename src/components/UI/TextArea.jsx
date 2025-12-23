//src/components/UI/TextArea.jsx
'use client';

import React, { forwardRef } from 'react';

const TextArea = forwardRef(({ label, name, value, onChange, placeholder, className = '', labelClassName = '', textareaClassName = '', disabled = false, rows = 4, height, ...props }, ref) => {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label htmlFor={name} className={`block text-sm font-medium text-baltic-black mb-2 ${labelClassName}`}>
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
                className={`w-full p-2 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60 disabled:bg-gray-200 disabled:cursor-not-allowed ${textareaClassName}`}
                {...props}
            />
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