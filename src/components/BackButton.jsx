'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

export default function BackButton({ 
  className = "", 
  onClick,
  showOnHome = false 
}) {
  const router = useRouter();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  // Don't show on home page unless explicitly requested
  if (!showOnHome && (pathname === '/' || pathname === '/home')) {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-300 dark:border-gray-600 
        bg-white dark:bg-gray-800 flex items-center justify-center 
        hover:border-gray-400 dark:hover:border-gray-500 
        hover:bg-gray-50 dark:hover:bg-gray-700 
        hover:shadow-md transition-all duration-200 
        transform hover:scale-105 active:scale-95
        ${className}
      `}
      aria-label="Go back"
    >
      <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
    </button>
  );
}
