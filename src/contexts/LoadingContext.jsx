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
    // Ensure loader shows immediately on page load
    setIsLoading(true);
    
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => {
      // Longer delay for initial load, shorter for navigation
      setTimeout(() => setIsLoading(false), 800);
    };

    // Handle initial load - always show loader for at least 1.5 seconds
    // This ensures header/footer don't show on new tab or first visit
    setTimeout(() => setIsLoading(false), 1500);

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
