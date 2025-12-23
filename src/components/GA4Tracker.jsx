'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function GA4TrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only run on client and after mount
    if (typeof window === 'undefined') return;
    
    const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (!id) return;
    if (typeof window.gtag !== 'function') return;

    try {
      const query = searchParams?.toString();
      const page_path = query ? `${pathname}?${query}` : pathname;
      window.gtag('config', id, { page_path });
    } catch (error) {
      // Silently fail if there's an issue
      console.warn('GA4 tracking error:', error);
    }
  }, [pathname, searchParams]);

  return null;
}

export default function GA4Tracker() {
  return (
    <Suspense fallback={null}>
      <GA4TrackerInner />
    </Suspense>
  );
}

