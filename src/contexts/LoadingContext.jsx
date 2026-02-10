// src/contexts/LoadingContext.jsx
'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const LoadingContext = createContext();

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);

  const showLoader = () => setIsLoading(true);
  const hideLoader = () => setIsLoading(false);

  // Show loader on initial page load and route changes
  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => {
      // Small delay to ensure content is ready
      setTimeout(() => setIsLoading(false), 500);
    };

    // Handle initial load
    handleComplete();

    // Listen for route changes and page refresh
    if (typeof window !== 'undefined') {
      // Page visibility change (tab switching)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          handleStart();
          handleComplete();
        }
      };

      // Browser back/forward buttons
      const handlePopState = () => {
        handleStart();
        handleComplete();
      };

      // Page refresh
      const handleBeforeUnload = () => {
        setIsLoading(true);
      };

      // Listen for navigation events (for client-side routing)
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = function(...args) {
        handleStart();
        setTimeout(handleComplete, 100);
        return originalPushState.apply(this, args);
      };

      history.replaceState = function(...args) {
        handleStart();
        setTimeout(handleComplete, 100);
        return originalReplaceState.apply(this, args);
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('popstate', handlePopState);
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        history.pushState = originalPushState;
        history.replaceState = originalReplaceState;
      };
    }
  }, []);

  return (
    <LoadingContext.Provider value={{
      isLoading,
      showLoader,
      hideLoader
    }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}
