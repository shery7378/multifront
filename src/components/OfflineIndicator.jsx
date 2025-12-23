'use client';

import { useOffline } from '@/hooks/useOffline';
import { useEffect, useState } from 'react';

/**
 * Component to show offline/online status indicator
 */
export default function OfflineIndicator() {
  const { isOnline, wasOffline } = useOffline();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
    } else if (wasOffline) {
      // Show "back online" message briefly
      setShowBanner(true);
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowBanner(false);
    }
  }, [isOnline, wasOffline]);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-yellow-500 text-yellow-900'
      }`}
      role="alert"
      aria-live="polite"
    >
      {isOnline ? (
        <span>✓ You're back online. Syncing your data...</span>
      ) : (
        <span>⚠️ You're offline. Some features may be limited.</span>
      )}
    </div>
  );
}

