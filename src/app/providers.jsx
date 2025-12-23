// src/app/providers.jsx
'use client';

import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../store';
import { Provider } from 'react-redux';
import { useLoadAuth } from '@/hooks/useLoadAuth';
import { I18nProvider } from '@/contexts/I18nContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { PromotionsModalProvider } from '@/contexts/PromotionsModalContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import GA4Tracker from '@/components/GA4Tracker';
import { CartTrackingProvider } from '@/components/CartTrackingProvider';

function AuthLoader({ children }) {
  useLoadAuth();
  return children;
}

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <I18nProvider>
            <CurrencyProvider>
              <PromotionsModalProvider>
                <AuthLoader>
                  <CartTrackingProvider>
                  {children}
                  <GA4Tracker />
                  </CartTrackingProvider>
                </AuthLoader>
              </PromotionsModalProvider>
            </CurrencyProvider>
          </I18nProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}
