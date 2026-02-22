'use client';

import { createContext, useContext } from 'react';

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  const value = {
    theme: 'light',
    isDark: false,
    mounted: true,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

