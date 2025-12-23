'use client';

import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';
import { languages } from '@/i18n';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function LanguageSwitcher({ className = '' }) {
  const { language, changeLanguage } = useI18n();
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentLang = languages[language] || languages.en;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2 rounded-lg border transition-colors min-w-[60px] sm:min-w-0 ${
          isDark 
            ? 'border-slate-700 bg-slate-800 hover:bg-slate-700' 
            : 'border-gray-200 bg-white hover:bg-gray-50'
        }`}
        aria-label="Select language"
      >
        <span className="text-base sm:text-lg flex-shrink-0">{currentLang.flag}</span>
        <span className={`text-xs sm:text-sm font-medium ${
          isDark ? 'text-gray-200' : 'text-gray-700'
        }`}>
          {currentLang.code.toUpperCase()}
        </span>
        <ChevronDownIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''} ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`} />
      </button>

      {isOpen && (
        <div className={`absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 mt-2 w-[180px] sm:w-48 max-w-[calc(100vw-1rem)] rounded-lg shadow-lg z-[100] max-h-64 overflow-y-auto ${
          isDark 
            ? 'bg-slate-800 border-slate-700 border' 
            : 'bg-white border-gray-200 border'
        }`}>
          {Object.values(languages).map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                changeLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-2.5 text-left transition-colors touch-manipulation ${
                language === lang.code 
                  ? isDark 
                    ? 'bg-vivid-red/20 text-vivid-red' 
                    : 'bg-vivid-red/10 text-vivid-red'
                  : isDark 
                    ? 'text-gray-200 hover:bg-slate-700 active:bg-slate-600' 
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <span className="text-lg sm:text-xl flex-shrink-0">{lang.flag}</span>
              <span className="text-xs sm:text-sm font-medium flex-1 truncate">{lang.name}</span>
              {language === lang.code && (
                <span className="text-vivid-red">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

