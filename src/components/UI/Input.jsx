//src/components/UI/Input.jsx
'use client';

import React, { forwardRef } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';

const Input = forwardRef(({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  className = '',         // container div
  labelClassName = '',      // label span
  inputClassName = '',    // custom input class
  disabled = false,
  error = '',             // 👈 new error prop
}, ref) => {
  const hasError = !!error;
  
  const baseInputClasses = `
    w-full px-4 py-2 rounded-md text-base
    bg-ghost-white border
    ${hasError ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-vivid-red'}
    text-dark-text placeholder:text-input-placeholder
    focus:outline-none focus:ring-2
    transition duration-200
  `;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className={`text-sm font-medium text-dark-text ${labelClassName}`}
        >
          {label}
          {required && <span className="text-vivid-red ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={`${baseInputClasses} ${inputClassName}`}
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

Input.displayName = 'Input';
export default Input;



// Example 1: Basic Text Input with Label
{/* <Input
  label="First Name"
  name="firstName"
  value={firstName}
  onChange={handleChange}
  placeholder="Enter your first name"
  required
/> */}

// Example 2: Email Input with Custom Class

{/* <Input
  label="Email"
  name="email"
  type="email"
  value={email}
  onChange={handleChange}
  placeholder="Enter your email"
  className="w-1/2 mx-auto mt-4"
/> */}

// Example 3: Password Input with No Label

{/* <Input
  name="password"
  type="password"
  value={password}
  onChange={handleChange}
  placeholder="Enter your password"
  required
/> */}

// Example 4: Multiple Inputs in a Form

{/* <Input
  label="First Name"
  name="firstName"
  value={formData.firstName}
  onChange={handleChange}
  placeholder="Enter your first name"
  required
/> */}

// Example 5: Controlled Input with Validation
{/* <div className="p-4">
  <Input
    label="Username"
    name="username"
    value={username}
    onChange={handleChange}
    placeholder="Enter your username"
    required
    disabled={isDisabled}
  />
  {isDisabled && <p className="text-red-500 text-sm mt-1">Username too long!</p>}
</div> */}