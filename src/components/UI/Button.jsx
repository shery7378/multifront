//src/components/UI/Button.jsx
'use client';
import React from 'react';

export default function Button({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    className = '',
    fullWidth = false,
    isLoading = false,
    disabled = false,
    iconLeft = null,
    iconRight = null,
    ...props
}) {
    const baseClasses = `
    inline-flex items-center justify-center font-medium text-sm rounded-full 
    transition-all duration-300 px-6 h-[46px] cursor-pointer
    active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold
  `;

    const variants = {
        simple: ' text-baltic-black font-semibold hover:bg-vivid-red/10',
        primary: 'bg-vivid-red text-white hover:bg-red-600 hover:shadow-[0_0_10px_#ef4444]',
        secondary: 'bg-bright-gray text-gray-800 hover:bg-gray-200',
        outline: 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
        transparent: 'bg-transparent text-vivid-red hover:bg-vivid-red/10',
        glow: `
      border border-gray-200 bg-white text-black
      hover:border-red-500 hover:shadow-[0_0_10px_#ef4444]
    `,
    };

    const content = (
        <>
            {isLoading ? (
                <span className="animate-spin h-5 w-5 border-2 border-gray-200 border-t-transparent rounded-full"></span>
            ) : (
                <>
                    {iconLeft && <span className="mr-2">{iconLeft}</span>}
                    <span className="text-nowrap">{children}</span>
                    {iconRight && <span className="ml-2">{iconRight}</span>}
                </>
            )}
        </>
    );

    return (
        <button
            type={type}
            onClick={onClick}
            className={`
        ${baseClasses} 
        ${variants[variant] || ''} 
        ${fullWidth ? 'w-full' : 'w-auto'} 
        ${className}
      `}
            disabled={disabled || isLoading}
            {...props}
        >
            {content}
        </button>
    );
}

// // Basic primary
// <Button onClick={() => console.log('clicked')}>
//   Sign Up
// </Button>

// // Outline with iconRight
// <Button variant="outline" iconRight={<ArrowRightIcon className="w-4 h-4" />}>
//   Learn More
// </Button>

// // Full width loading
// <Button fullWidth isLoading>
//   Submitting...
// </Button>