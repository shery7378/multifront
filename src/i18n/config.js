// i18n configuration
export const languages = {
  en: { name: 'English', code: 'en', flag: '🇺🇸' },
  es: { name: 'Español', code: 'es', flag: '🇪🇸' },
  fr: { name: 'Français', code: 'fr', flag: '🇫🇷' },
  ar: { name: 'العربية', code: 'ar', flag: '🇸🇦' },
  de: { name: 'Deutsch', code: 'de', flag: '🇩🇪' },
  it: { name: 'Italiano', code: 'it', flag: '🇮🇹' },
  pt: { name: 'Português', code: 'pt', flag: '🇵🇹' },
  zh: { name: '中文', code: 'zh', flag: '🇨🇳' },
};

export const defaultLanguage = 'en';

export const getStoredLanguage = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('language') || defaultLanguage;
  }
  return defaultLanguage;
};

export const setStoredLanguage = (lang) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lang);
  }
};

