import React from 'react';

export default function SectionLoader({ className = "min-h-[60vh]", text = "Loading..." }) {
  return (
    <div className={`w-full flex flex-col items-center justify-center ${className}`}>
      <div className="relative mb-4">
        <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#F44322] rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-gray-500 font-medium">{text}</p>
    </div>
  );
}
