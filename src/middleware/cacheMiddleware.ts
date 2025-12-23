/**
 * Next.js Middleware for API response caching
 * Adds cache headers to API responses
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function cacheMiddleware(request: NextRequest, response?: NextResponse) {
  const res = response || NextResponse.next();
  
  const pathname = request.nextUrl.pathname;

  // Cache static assets aggressively
  if (pathname.startsWith('/_next/static/') || 
      pathname.startsWith('/images/') ||
      pathname.startsWith('/icons/') ||
      pathname.startsWith('/fonts/')) {
    res.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  // Cache API responses with appropriate TTL
  if (pathname.startsWith('/api/')) {
    // Public API endpoints - cache for 1 minute
    if (pathname.startsWith('/api/products') || 
        pathname.startsWith('/api/stores') ||
        pathname.startsWith('/api/categories')) {
      res.headers.set(
        'Cache-Control',
        'public, s-maxage=60, stale-while-revalidate=300'
      );
    }
    // User-specific endpoints - no cache
    else if (pathname.startsWith('/api/user') || 
             pathname.startsWith('/api/cart') ||
             pathname.startsWith('/api/orders')) {
      res.headers.set(
        'Cache-Control',
        'private, no-cache, no-store, must-revalidate'
      );
    }
    // Default API cache
    else {
      res.headers.set(
        'Cache-Control',
        'public, s-maxage=30, stale-while-revalidate=60'
      );
    }
  }

  // Cache HTML pages with revalidation
  if (pathname.endsWith('.html') || (!pathname.includes('.') && !pathname.startsWith('/api/'))) {
    res.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );
  }

  return res;
}

