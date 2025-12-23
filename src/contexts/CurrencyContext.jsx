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
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [supportedCurrencies, setSupportedCurrencies] = useState([]);
  const [currencyRates, setCurrencyRates] = useState({});
  const [defaultCurrency, setDefaultCurrency] = useState(DEFAULT_CURRENCY);
  const [isLoading, setIsLoading] = useState(true);

  // Load currency from cookie/localStorage on mount
  useEffect(() => {
    async function initializeCurrency() {
      try {
        // Try to get currency from cookie (set by backend)
        // For now, we'll use localStorage as fallback
        const storedCurrency = localStorage.getItem('currency');
        if (storedCurrency) {
          setCurrency(storedCurrency);
        }

        // Fetch supported currencies and rates from backend
        try {
          const [currenciesResponse, ratesResponse] = await Promise.all([
            axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/api/currencies/supported`,
              { 
                withCredentials: true,
                headers: { 'Accept': 'application/json' }
              }
            ),
            axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/api/currencies/rates`,
              { 
                withCredentials: true,
                headers: { 'Accept': 'application/json' }
              }
            )
          ]);

          if (currenciesResponse.data && Array.isArray(currenciesResponse.data)) {
            setSupportedCurrencies(currenciesResponse.data);
          }

          if (ratesResponse.data) {
            setDefaultCurrency(ratesResponse.data.default_currency || DEFAULT_CURRENCY);
            setCurrencyRates(ratesResponse.data.rates || {});
            
            // If stored currency is not set, use default currency
            if (!storedCurrency && ratesResponse.data.default_currency) {
              setCurrency(ratesResponse.data.default_currency);
              localStorage.setItem('currency', ratesResponse.data.default_currency);
            }
          }
        } catch (error) {
          console.warn('Could not fetch currency data, using defaults', error);
          // Fallback to common currencies
          setSupportedCurrencies(['GBP', 'USD', 'EUR', 'AED', 'PKR', 'INR']);
          setCurrencyRates({});
        }
      } catch (error) {
        console.error('Error initializing currency:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initializeCurrency();
  }, []);

  const changeCurrency = useCallback(async (newCurrency) => {
    if (!newCurrency) return;

    try {
      // Call backend API to set currency cookie
      await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/current-currency/${newCurrency}`,
        { 
          withCredentials: true,
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      setCurrency(newCurrency);
      localStorage.setItem('currency', newCurrency);

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
    const code = currencyCode || currency;
    return CURRENCY_SYMBOLS[code] || code;
  }, [currency]);

  const formatPrice = useCallback((amount, currencyCode = null) => {
    const code = currencyCode || currency;
    const symbol = getCurrencySymbol(code);
    
    // Convert amount to number
    let numericAmount = typeof amount === 'number' 
      ? amount 
      : parseFloat(amount || 0);

    // Convert price if needed (prices from backend are in default currency)
    if (code !== defaultCurrency && currencyRates[code]) {
      // Multiply by exchange rate to convert from default currency to selected currency
      numericAmount = numericAmount * currencyRates[code];
    }

    // Format to 2 decimal places
    const formattedAmount = numericAmount.toFixed(2);
    
    // Format based on currency (some currencies put symbol after)
    if (['EUR', 'GBP'].includes(code)) {
      return `${symbol}${formattedAmount}`;
    }
    return `${symbol}${formattedAmount}`;
  }, [currency, defaultCurrency, currencyRates, getCurrencySymbol]);

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

