'use client';

import { useEffect } from 'react';
import { initDB } from '@/utils/offlineStorage';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize IndexedDB for offline storage
    initDB().catch((error) => {
      console.warn('[Service Worker] IndexedDB initialization failed:', error);
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
      // Only register on HTTPS or localhost
      const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (!isSecureContext) {
        console.warn('[Service Worker] Service workers require HTTPS or localhost');
        return;
      }

      // Register unified service worker (includes offline support + OneSignal integration)
      navigator.serviceWorker
        .register('/service-worker.js', {
          scope: '/',
        })
        .then((registration) => {
          console.log('[Service Worker] Registration successful:', registration.scope);

          // Check for updates every hour
          const updateInterval = setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('[Service Worker] New version available');
                  
                  // Notify user about update (optional - can be customized)
                  // For now, just log it. You can show a toast notification instead
                  if (process.env.NODE_ENV === 'development') {
                    console.log('[Service Worker] New version ready. Reload to update.');
                  }
                } else if (newWorker.state === 'activated') {
                  // New worker activated, reload to use it
                  console.log('[Service Worker] New version activated');
                  if (process.env.NODE_ENV === 'development') {
                    window.location.reload();
                  }
                }
              });
            }
          });

          // Cleanup interval on unmount
          return () => clearInterval(updateInterval);
        })
        .catch((error) => {
          console.error('[Service Worker] Registration failed:', error);
        });

      // Handle service worker controller change (page refresh after update)
      let refreshing = false;
      const handleControllerChange = () => {
        if (!refreshing && navigator.serviceWorker.controller) {
          refreshing = true;
          // Only auto-reload in production if needed
          // In development, let user manually reload
          if (process.env.NODE_ENV === 'production') {
            window.location.reload();
          }
        }
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // Cleanup
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  return null;
}

