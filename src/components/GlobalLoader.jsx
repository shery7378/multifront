// src/components/GlobalLoader.jsx
'use client';
import { useLoading } from '@/contexts/LoadingContext';

export default function GlobalLoader() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="loader-overlay fixed inset-0 z-[99999] flex items-center justify-center bg-white dark:bg-gray-900 animate-fade-in">
      <div className="flex flex-col items-center space-y-6">
        {/* Modern spinner with brand colors */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-vivid-red rounded-full border-t-transparent animate-spin"></div>
        </div>
        
        {/* Loading text with brand font */}
        <div className="text-gray-600 dark:text-gray-400 text-lg font-medium animate-pulse" style={{ fontFamily: 'var(--font-manrope), sans-serif' }}>
          Loading...
        </div>
        
        {/* Brand name with consistent styling */}
        <div className="text-2xl font-bold text-gray-800 dark:text-white" style={{ fontFamily: 'var(--font-manrope), sans-serif', letterSpacing: '-1.1px' }}>
          MultiKonnect
        </div>
      </div>
      
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(244, 67, 34, 0.03) 10px,
            rgba(244, 67, 34, 0.03) 20px
          )`
        }}></div>
      </div>
    </div>
  );
}
