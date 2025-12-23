'use client';

import { useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { getStoredLanguage } from '@/i18n';

export default function LanguageInitializer() {
  const { changeLanguage } = useI18n();

  useEffect(() => {
    // Initialize language and set HTML attributes
    const lang = getStoredLanguage();
    changeLanguage(lang);
  }, [changeLanguage]);

  return null;
}

