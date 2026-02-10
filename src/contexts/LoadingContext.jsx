// src/contexts/LoadingContext.jsx
'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const LoadingContext = createContext();

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPageRefresh, setIsPageRefresh] = useState(false);

  // Detect page refresh on mount
  useEffect(() => {
    let isRefresh = false;
    
    // Method 1: Check navigation entries
    if (typeof performance !== 'undefined' && performance.getEntriesByType) {
      const navigationEntries = performance.getEntriesByType('navigation');
      isRefresh = navigationEntries.length > 0 && 
                 navigationEntries[0].type === 'reload';
    }
    
    // Method 2: Check sessionStorage for navigation type
    if (!isRefresh && typeof sessionStorage !== 'undefined') {
      const navigationCount = sessionStorage.getItem('navigationCount');
      const newCount = navigationCount ? parseInt(navigationCount) + 1 : 1;
      sessionStorage.setItem('navigationCount', newCount.toString());
      
      // If this is not the first navigation, it might be a refresh
      if (newCount > 1) {
        isRefresh = true;
      }
    }

    if (isRefresh) {
      setIsPageRefresh(true);
      setIsLoading(true);
      
      // Hide loader after content has had time to load
      const timer = setTimeout(() => {
        setIsLoading(false);
        setIsPageRefresh(false);
      }, 2500); // Slightly longer to ensure content loads

      return () => clearTimeout(timer);
    } else {
      // Initialize navigation count for first load
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('navigationCount', '1');
      }
    }
  }, []);

  // Listen for beforeunload to show loader on refresh
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Show loader immediately when user tries to refresh/navigate away
      setIsLoading(true);
      
      // Small delay to ensure loader shows before page unloads
      setTimeout(() => {
        // This might not execute due to page unloading, but it's a safety measure
      }, 100);
    };

    // Listen for page visibility changes (another way to detect refresh)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is being hidden (potential refresh or navigation)
        setIsLoading(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Hide loader when page becomes visible again (in case of quick refresh)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPageRefresh) {
        // Page became visible after being hidden, hide loader after a short delay
        const timer = setTimeout(() => {
          setIsLoading(false);
          setIsPageRefresh(false);
        }, 500);
        
        return () => clearTimeout(timer);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPageRefresh]);

  const showLoader = () => setIsLoading(true);
  const hideLoader = () => setIsLoading(false);

  return (
    <LoadingContext.Provider value={{
      isLoading,
      isPageRefresh,
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
