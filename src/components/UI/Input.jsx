//src/components/UI/Input.jsx
'use client';

export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  className = '',         // container div
  labelClassName = '',      // label span
  inputClassName = '',    // 👈 custom input class
  disabled = false,
}) {
  const baseInputClasses = `
    w-full px-4 py-2 rounded-md text-base
    bg-input-bg border border-input-border
    bg-ghost-white border-gray-200
    text-dark-text placeholder:text-input-placeholder
    focus:outline-none focus:ring-2 focus:ring-vivid-red
    transition duration-200
  `;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className={`text-sm font-medium text-dark-text  ${labelClassName}`}
        >
          {label}
        </label>
      )}
      <input
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
    </div>
  );
}

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