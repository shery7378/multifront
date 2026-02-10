// src/components/GlobalLoader.jsx
'use client';
import { useLoading } from '@/contexts/LoadingContext';

export default function GlobalLoader() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center space-y-4">
        {/* Modern spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        
        {/* Loading text */}
        <div className="text-gray-600 text-lg font-medium animate-pulse">
          Loading...
        </div>
        
        {/* Optional: Add your brand logo or name */}
        <div className="text-2xl font-bold text-gray-800">
          MultiKonnect
        </div>
      </div>
      
      {/* Optional: Add a subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(0,0,0,.03) 10px,
            rgba(0,0,0,.03) 20px
          )`
        }}></div>
      </div>
    </div>
  );
}
