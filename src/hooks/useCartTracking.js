'use client';

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { trackCart, clearCartTracking, markCartAsConverted } from '@/utils/cartTracking';

/**
 * Hook to automatically track cart changes
 */
export function useCartTracking() {
  const { items, total } = useSelector((state) => state.cart);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    // Track cart when items change
    if (items.length > 0) {
      const userEmail = isAuthenticated ? (user?.email || user?.data?.email) : null;
      const userId = isAuthenticated ? (user?.id || user?.data?.id || user?.data?.user?.id) : null;
      const userPhone = isAuthenticated ? (user?.phone || user?.data?.phone || user?.data?.user?.phone) : null;
      
      console.log('🛒 Tracking cart:', {
        itemCount: items.length,
        total,
        userId,
        userEmail,
        isAuthenticated
      });
      
      trackCart(
        items,
        total,
        userId,
        userEmail,
        userPhone
      );
      hasTrackedRef.current = true;
    } else if (hasTrackedRef.current) {
      // Clear tracking when cart is empty
      clearCartTracking();
      hasTrackedRef.current = false;
    }
  }, [items, total, isAuthenticated, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't clear on unmount, keep tracking
    };
  }, []);

  return {
    markAsConverted: markCartAsConverted,
  };
}

