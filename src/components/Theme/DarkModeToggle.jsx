'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';

export default function DarkModeToggle({ className = '' }) {
  const { theme, toggleTheme, mounted } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`w-10 h-10 rounded-full bg-gray-200 ${className}`} />
    );
  }

  const handleToggle = () => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        relative w-12 h-6 rounded-full transition-all duration-300 ease-in-out
        ${theme === 'dark' ? 'bg-[#F44422]' : 'bg-gray-300'}
        focus:outline-none focus:ring-2 focus:ring-[#F44422] focus:ring-offset-2
        ${className}
      `}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      type="button"
    >
      {/* Toggle Circle */}
      <span
        className={`
          absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
          transition-transform duration-300 ease-in-out
          flex items-center justify-center
          ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}
          ${isAnimating ? 'scale-110' : 'scale-100'}
        `}
      >
        {theme === 'dark' ? (
          <svg
            className="w-3.5 h-3.5 text-gray-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        ) : (
          <svg
            className="w-3.5 h-3.5 text-yellow-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757l1.591-1.59a.75.75 0 00-1.06-1.061l-1.59 1.59a.75.75 0 001.06 1.061z" />
          </svg>
        )}
      </span>
    </button>
  );
}

