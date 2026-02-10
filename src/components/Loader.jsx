//src/components/Loader.jsx
'use client';

export default function Loader() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[9999] flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-vivid-red rounded-full animate-spin"></div>
        </div>
        
        {/* Loading text */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium" style={{ fontFamily: 'var(--font-manrope), sans-serif' }}>
            Loading...
          </p>
        </div>
      </div>
    </div>
  );
}
