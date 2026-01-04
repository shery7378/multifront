'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

const CurrencyContext = createContext();

// Common currency symbols mapping
const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  SEK: 'kr',
  NZD: 'NZ$',
  MXN: '$',
  SGD: 'S$',
  HKD: 'HK$',
  NOK: 'kr',
  TRY: '₺',
  RUB: '₽',
  ZAR: 'R',
  BRL: 'R$',
  AED: 'د.إ',
  SAR: '﷼',
  PKR: '₨',
  BDT: '৳',
  THB: '฿',
  MYR: 'RM',
  IDR: 'Rp',
  PHP: '₱',
  VND: '₫',
  KRW: '₩',
};

// Default currency if none is set
const DEFAULT_CURRENCY = 'GBP';

export function CurrencyProvider({ children }) {
  // Always use GBP as the currency
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [supportedCurrencies, setSupportedCurrencies] = useState([DEFAULT_CURRENCY]);
  const [currencyRates, setCurrencyRates] = useState({ [DEFAULT_CURRENCY]: 1 });
  const [defaultCurrency, setDefaultCurrency] = useState(DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to clean currency code (remove serialized data artifacts)
  const cleanCurrencyCode = (code) => {
    if (!code || typeof code !== 'string') return DEFAULT_CURRENCY;
    
    // Handle double-serialized values like "s:10:"s:3:"GBP";";"
    // First, try to extract the inner value
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
    return cleaned && cleaned.length === 3 ? cleaned : DEFAULT_CURRENCY;
  };

  // Always use GBP - no need to fetch from backend
  useEffect(() => {
    // Set currency to GBP and clear any corrupted localStorage
    setCurrency(DEFAULT_CURRENCY);
    localStorage.setItem('currency', DEFAULT_CURRENCY);
    setDefaultCurrency(DEFAULT_CURRENCY);
    setSupportedCurrencies([DEFAULT_CURRENCY]);
    setCurrencyRates({ [DEFAULT_CURRENCY]: 1 });
    setIsLoading(false);
  }, []);

  const changeCurrency = useCallback(async (newCurrency) => {
    if (!newCurrency) return;

    // Clean the currency code before using it
    const cleanedCurrency = cleanCurrencyCode(newCurrency);
    if (!cleanedCurrency || cleanedCurrency === DEFAULT_CURRENCY && newCurrency !== DEFAULT_CURRENCY) {
      console.warn('Invalid currency code:', newCurrency);
      return;
    }

    try {
      // Call backend API to set currency cookie
      await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/current-currency/${cleanedCurrency}`,
        { 
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      setCurrency(cleanedCurrency);
      localStorage.setItem('currency', cleanedCurrency);

      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency: newCurrency } }));
      }
    } catch (error) {
      console.error('Error changing currency:', error);
      // Still update local state even if API call fails
      setCurrency(newCurrency);
      localStorage.setItem('currency', newCurrency);
    }
  }, []);

  const getCurrencySymbol = useCallback((currencyCode = null) => {
    // Always return pound symbol for GBP
    return '£';
  }, []);

  const formatPrice = useCallback((amount, currencyCode = null) => {
    // Always use GBP with pound symbol
    const symbol = '£';
    
    // Convert amount to number
    let numericAmount = typeof amount === 'number' 
      ? amount 
      : parseFloat(amount || 0);

    // Format to 2 decimal places
    const formattedAmount = numericAmount.toFixed(2);
    
    // Always format as GBP: £XX.XX
    return `${symbol}${formattedAmount}`;
  }, []);

  const value = useMemo(() => ({
    currency,
    defaultCurrency,
    supportedCurrencies,
    currencyRates,
    changeCurrency,
    getCurrencySymbol,
    formatPrice,
    isLoading,
  }), [currency, defaultCurrency, supportedCurrencies, currencyRates, changeCurrency, getCurrencySymbol, formatPrice, isLoading]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}

