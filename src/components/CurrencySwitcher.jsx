'use client';

import { useEffect } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { currency, getCurrencySymbol, isLoading } = useCurrency();
  const { isDark } = useTheme();

  // Debug: Log to verify component is rendering
  useEffect(() => {
    console.log('CurrencySwitcher rendered', { currency, isLoading });
  }, [currency, isLoading]);

  // Ensure we have a valid currency
  const currentCurrency = currency || 'GBP';

  // Clean currency code - remove any serialized data artifacts
  const cleanCurrencyCode = (code) => {
    if (!code || typeof code !== 'string') return 'GBP';
    
    // Handle double-serialized values like "s:10:"s:3:"GBP";";"
    let cleaned = code;
    
    // Pattern for double serialization: s:10:"s:3:"GBP";";
    const doubleSerializedMatch = cleaned.match(/s:\d+:"s:\d+:"([A-Z]{3})";";/);
    if (doubleSerializedMatch) {
      cleaned = doubleSerializedMatch[1];
    } else {
      // Pattern for single serialization: s:3:"GBP";
      const singleSerializedMatch = cleaned.match(/s:\d+:"([A-Z]{3})";/);
      if (singleSerializedMatch) {
        cleaned = singleSerializedMatch[1];
      } else {
        // Remove PHP serialized data patterns
        cleaned = cleaned.replace(/^[aOs]:\d+:/, '').replace(/[^A-Z]/g, '').substring(0, 3);
      }
    }
    
    // Final validation - must be exactly 3 uppercase letters
    cleaned = cleaned.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
    return cleaned && cleaned.length === 3 ? cleaned : 'GBP';
  };
  
  const cleanCurrency = typeof currentCurrency === 'string' 
    ? cleanCurrencyCode(currentCurrency)
    : 'GBP';
  const displayCurrency = cleanCurrency && cleanCurrency.length === 3 ? cleanCurrency : 'GBP';
  const currencySymbol = getCurrencySymbol ? getCurrencySymbol(displayCurrency) : '£';
  const currencyName = CURRENCY_NAMES[displayCurrency] || displayCurrency;

  // Show loading state or fallback if context is not ready
  if (isLoading && !currency) {
    return (
      <div className={`${className}`}>
        <div className={`flex flex-col px-2.5 sm:px-3 py-2 sm:py-2 ${
          isDark ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <span className="text-xs sm:text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className={`flex flex-col px-2.5 sm:px-3 py-2 sm:py-2`}>
        <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
          isDark ? 'text-gray-200' : 'text-gray-700'
        }`}>
          {currencySymbol} {displayCurrency}
        </span>
        <span className={`text-[10px] sm:text-xs whitespace-nowrap ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {currencyName}
        </span>
      </div>
    </div>
  );
}

