'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { messages, getStoredLanguage, setStoredLanguage, defaultLanguage } from '@/i18n';

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load language from localStorage on mount
    const storedLang = getStoredLanguage();
    if (messages[storedLang]) {
      setLanguage(storedLang);
    }
    setIsLoading(false);
  }, []);

  const changeLanguage = useCallback((lang) => {
    if (messages[lang]) {
      // For now, only update in‑app language state and storage.
      // Avoid touching document / window at all to keep SSR/prerender safe.
      setLanguage(lang);
      setStoredLanguage(lang);
    }
  }, []);

  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let value = messages[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        let fallbackValue = messages[defaultLanguage];
        for (const fk of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
            fallbackValue = fallbackValue[fk];
          } else {
            return key; // Return key if translation not found
          }
        }
        value = fallbackValue;
        break;
      }
    }

    // Replace parameters in string
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{(\w+)\}/g, (match, key) => {
        return params[key] !== undefined ? params[key] : match;
      });
    }

    return typeof value === 'string' ? value : key;
  }, [language]);

  const value = useMemo(() => ({
    language,
    changeLanguage,
    t,
    isLoading,
  }), [language, changeLanguage, t, isLoading]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

