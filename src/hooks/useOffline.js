'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status
 * Also provides utilities for offline functionality
 */
export function useOffline() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      
      // Trigger sync of offline actions
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_OFFLINE_ACTIONS',
        });
      }
      
      // Clear the wasOffline flag after a delay
      setTimeout(() => setWasOffline(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Listen to online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also check connection API if available
    if ('connection' in navigator) {
      const connection = navigator.connection;
      const updateConnectionStatus = () => {
        setIsOnline(connection.effectiveType !== 'offline' && navigator.onLine);
      };

      connection.addEventListener('change', updateConnectionStatus);
      updateConnectionStatus();

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', updateConnectionStatus);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
  };
}

/**
 * Hook to check if service worker is active
 */
export function useServiceWorker() {
  const [swStatus, setSwStatus] = useState({
    supported: false,
    registered: false,
    active: false,
    installing: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const checkSW = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        
        setSwStatus({
          supported: true,
          registered: !!registration,
          active: !!registration?.active,
          installing: !!registration?.installing || !!registration?.waiting,
        });

        // Listen for updates
        if (registration) {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              setSwStatus((prev) => ({
                ...prev,
                installing: true,
              }));

              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setSwStatus((prev) => ({
                    ...prev,
                    installing: false,
                  }));
                } else if (newWorker.state === 'activated') {
                  setSwStatus((prev) => ({
                    ...prev,
                    active: true,
                    installing: false,
                  }));
                }
              });
            }
          });
        }
      } catch (error) {
        console.error('[useServiceWorker] Error checking service worker:', error);
      }
    };

    checkSW();

    // Listen for controller changes
    const handleControllerChange = () => {
      checkSW();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return swStatus;
}

