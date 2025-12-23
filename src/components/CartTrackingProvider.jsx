'use client';

import { useCartTracking } from '@/hooks/useCartTracking';

/**
 * Provider component to enable cart tracking
 * This should be included in the root layout
 */
export function CartTrackingProvider({ children }) {
  // This hook will automatically track cart changes
  useCartTracking();

  return <>{children}</>;
}

