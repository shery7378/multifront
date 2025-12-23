//src/components/UI/CustomCheckbox.jsx

import React, { useEffect, useRef } from 'react';

export default function CustomCheckbox({
  id = 'custom-checkbox',
  label = '',
  checked,
  defaultChecked = false,
  onChange = () => {},
  className = '',
  labelClassName = '',
  boxSize = 'w-5 h-5',
  color = 'vivid-red',
  disabled = false,
  error = false,
  checkIcon = null,
  indeterminate = false,
  name,
  ...rest // for react-hook-form or native form props
}) {
  const inputRef = useRef(null);
  const isControlled = checked !== undefined;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const baseColor = error ? 'red-500' : color;
  const isChecked = isControlled ? checked : undefined;

  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-2 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <input
        ref={inputRef}
        type="checkbox"
        id={id}
        name={name}
        checked={isControlled ? isChecked : undefined}
        defaultChecked={!isControlled ? defaultChecked : undefined}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
        {...rest}
      />
      <div
        className={`
          min-w-5 min-h-5 rounded-sm border flex items-center justify-center transition-colors
          ${boxSize}
          ${checked
            ? `bg-${baseColor} border-${baseColor}`
            : `bg-white border-${error ? 'red-500' : 'gray-400'}`}
        `}
      >
        {indeterminate ? (
          <div className="w-2.5 h-0.5 bg-white rounded-sm" />
        ) : checked && (
          checkIcon ? (
            checkIcon
          ) : (
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              viewBox="0 0 20 20"
              stroke="currentColor"
            >
              <path
                d="M5 10L8.2 13L15 6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )
        )}
      </div>
      {label && <span className={`text-black/50 text-start ${labelClassName}`}>{label}</span>}
    </label>
  );
}

// Minimal usage (uses all defaults)
{/* <CustomCheckbox onChange={setIsAgreed} checked={isAgreed} /> */}

// ✅ Controlled with React State
// With label and custom ID:

{/* <CustomCheckbox
  id="agree"
  label="I agree to the terms."
  checked={isAgreed}
  onChange={setIsAgreed}
/> */}

// ✅ Uncontrolled with defaultChecked
{/* <CustomCheckbox
  id="promo"
  label="Get promotional emails"
  defaultChecked={true}
  onChange={(val) => console.log(val)}
/> */}

// With react-hook-form
// import { useForm, Controller } from 'react-hook-form';

// const { control, handleSubmit } = useForm();

// <Controller
//   control={control}
//   name="acceptTerms"
//   defaultValue={false}
//   render={({ field }) => (
//     <CustomCheckbox
//       {...field}
//       label="I accept terms"
//       error={field.value === false}
//     />
//   )}
// />

// ✅ Indeterminate Example

{/* <CustomCheckbox
  label="Partially selected"
  checked={false}
  indeterminate={true}
/> */}


// With custom size and color:

{/* <CustomCheckbox
  id="promo"
  label="Subscribe to newsletter"
  checked={isSubscribed}
  onChange={setIsSubscribed}
  boxSize="w-6 h-6"
  color="green-600"
/> */}

// With error state:
{/* <CustomCheckbox
  checked={isChecked}
  onChange={setIsChecked}
  label="Please agree to continue"
  error={true}
/> */}

// With custom size, color, and icon:

{/* <CustomCheckbox
  id="newsletter"
  checked={subscribed}
  onChange={setSubscribed}
  label="Subscribe to newsletter"
  boxSize="w-6 h-6"
  color="green-600"
  checkIcon={
    <span className="text-white text-xs font-bold">✓</span>
  }
/> */}

