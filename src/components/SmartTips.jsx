'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const TIPS_BY_PAGE = {
  '/home': [
    { id: 1, text: '💡 Tip: Use filters to find products faster!', position: 'top' },
    { id: 2, text: '💡 Tip: Save your favorite stores for quick access!', position: 'top' },
  ],
  '/cart': [
    { id: 3, text: '💡 Tip: Check delivery slots before checkout!', position: 'top' },
    { id: 4, text: '💡 Tip: Apply coupon codes for discounts!', position: 'top' },
  ],
  '/check-out-delivery': [
    { id: 5, text: '💡 Tip: Save your address for faster checkout next time!', position: 'top' },
    { id: 6, text: '💡 Tip: Choose pickup for faster order fulfillment!', position: 'top' },
  ],
  '/product': [
    { id: 7, text: '💡 Tip: Check product reviews before buying!', position: 'top' },
    { id: 8, text: '💡 Tip: Subscribe to products for automatic reordering!', position: 'top' },
  ],
};

export default function SmartTips() {
  const pathname = usePathname();
  const [currentTip, setCurrentTip] = useState(null);
  const [dismissedTips, setDismissedTips] = useState(new Set());

  useEffect(() => {
    // Get tips for current page
    const tips = TIPS_BY_PAGE[pathname] || [];
    
    if (tips.length === 0) {
      setCurrentTip(null);
      return;
    }

    // Get dismissed tips from localStorage
    const stored = localStorage.getItem('dismissed_tips');
    if (stored) {
      setDismissedTips(new Set(JSON.parse(stored)));
    }

    // Find first non-dismissed tip
    const availableTip = tips.find(tip => !dismissedTips.has(tip.id));
    
    if (availableTip) {
      // Show tip after a delay (user might be stuck)
      const timer = setTimeout(() => {
        setCurrentTip(availableTip);
      }, 5000); // Show after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [pathname, dismissedTips]);

  const handleDismiss = () => {
    if (currentTip) {
      const newDismissed = new Set([...dismissedTips, currentTip.id]);
      setDismissedTips(newDismissed);
      localStorage.setItem('dismissed_tips', JSON.stringify([...newDismissed]));
      setCurrentTip(null);
    }
  };

  if (!currentTip) {
    return null;
  }

  return (
    <div
      className={`fixed ${currentTip.position === 'top' ? 'top-4' : 'bottom-4'} left-1/2 transform -translate-x-1/2 z-50 bg-white border border-vivid-red rounded-lg shadow-lg p-4 max-w-md animate-slide-in`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-oxford-blue flex-1">{currentTip.text}</p>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          aria-label="Dismiss tip"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

