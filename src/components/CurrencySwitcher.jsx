'use client';

import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

// Currency display names
const CURRENCY_NAMES = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CNY: 'Chinese Yuan',
  INR: 'Indian Rupee',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  SEK: 'Swedish Krona',
  NZD: 'New Zealand Dollar',
  MXN: 'Mexican Peso',
  SGD: 'Singapore Dollar',
  HKD: 'Hong Kong Dollar',
  NOK: 'Norwegian Krone',
  TRY: 'Turkish Lira',
  RUB: 'Russian Ruble',
  ZAR: 'South African Rand',
  BRL: 'Brazilian Real',
  AED: 'UAE Dirham',
  SAR: 'Saudi Riyal',
  PKR: 'Pakistani Rupee',
  BDT: 'Bangladeshi Taka',
  THB: 'Thai Baht',
  MYR: 'Malaysian Ringgit',
  IDR: 'Indonesian Rupiah',
  PHP: 'Philippine Peso',
  VND: 'Vietnamese Dong',
  KRW: 'South Korean Won',
};

export default function CurrencySwitcher({ className = '' }) {
  // Hooks must be called unconditionally - CurrencyProvider should wrap this component
  const { currency, supportedCurrencies, changeCurrency, getCurrencySymbol, isLoading } = useCurrency();
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Debug: Log to verify component is rendering
  useEffect(() => {
    console.log('CurrencySwitcher rendered', { currency, supportedCurrencies, isLoading });
  }, [currency, supportedCurrencies, isLoading]);

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

  const handleCurrencyChange = (newCurrency) => {
    if (changeCurrency) {
      changeCurrency(newCurrency);
    }
    setIsOpen(false);
  };

  // Use supported currencies if available, otherwise show common ones
  const currenciesToShow = supportedCurrencies && supportedCurrencies.length > 0 
    ? supportedCurrencies 
    : ['GBP', 'USD', 'EUR', 'AED', 'PKR', 'INR'];

  // Ensure we have a valid currency
  const currentCurrency = currency || 'GBP';

  // Show loading state or fallback if context is not ready
  if (isLoading && !currency) {
    return (
      <div className={`relative ${className}`}>
        <button
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
            isDark 
              ? 'border-slate-700 bg-slate-800' 
              : 'border-gray-200 bg-white'
          }`}
          disabled
        >
          <span className={`text-sm font-medium ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>Loading...</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 sm:py-2 rounded-lg border transition-colors min-w-[70px] sm:min-w-0 ${
          isDark 
            ? 'border-slate-700 bg-slate-800 hover:bg-slate-700' 
            : 'border-gray-200 bg-white hover:bg-gray-50'
        }`}
        aria-label="Select currency"
      >
        <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
          isDark ? 'text-gray-200' : 'text-gray-700'
        }`}>
          {(() => {
            // Clean currency code - remove any serialized data artifacts
            const cleanCurrency = typeof currentCurrency === 'string' 
              ? currentCurrency.replace(/^[aOs]:\d+:/, '').replace(/[^A-Z]/g, '').substring(0, 3)
              : currentCurrency;
            const displayCurrency = cleanCurrency && cleanCurrency.length === 3 ? cleanCurrency : 'GBP';
            return `${getCurrencySymbol ? getCurrencySymbol(displayCurrency) : '£'} ${displayCurrency}`;
          })()}
        </span>
        <ChevronDownIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''} ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`} />
      </button>

      {isOpen && (
        <div className={`absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 mt-2 w-[200px] sm:w-56 max-w-[calc(100vw-1rem)] rounded-lg shadow-lg z-[100] max-h-64 overflow-y-auto ${
          isDark 
            ? 'bg-slate-800 border-slate-700 border' 
            : 'bg-white border-gray-200 border'
        }`}>
          {currenciesToShow.map((curr) => (
            <button
              key={curr}
              onClick={() => handleCurrencyChange(curr)}
              className={`w-full flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-2.5 text-left transition-colors touch-manipulation ${
                currentCurrency === curr 
                  ? isDark 
                    ? 'bg-vivid-red/20 text-vivid-red' 
                    : 'bg-vivid-red/10 text-vivid-red'
                  : isDark 
                    ? 'text-gray-200 hover:bg-slate-700 active:bg-slate-600' 
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-medium truncate">
                  {getCurrencySymbol ? getCurrencySymbol(curr) : curr} {curr}
                </span>
                <span className={`text-[10px] sm:text-xs truncate ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {CURRENCY_NAMES[curr] || curr}
                </span>
              </div>
              {currentCurrency === curr && (
                <span className="text-vivid-red">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

