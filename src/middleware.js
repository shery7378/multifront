// middleware.js
import { NextResponse } from 'next/server';

// Paths that require authentication
const protectedRoutes = ['/check-out-delivery', '/user-account', '/orders'];

// Routes only accessible when NOT logged in (disabled: allow visiting login/register even if token exists)
// const guestOnlyRoutes = ['/login', '/register'];

export function middleware(request) {
  const token =
    request.cookies.get('auth_token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  const { pathname } = request.nextUrl;

  // if root path "/" then redirect to /home
  if (pathname === '/') {
    const response = NextResponse.redirect(new URL('/home', request.url));
    return applyCacheHeaders(request, response);
  }

  // ✅ If route is protected but no token → redirect to login
  if (protectedRoutes.some((path) => pathname.startsWith(path))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname); // optional: return after login
      const response = NextResponse.redirect(loginUrl);
      return applyCacheHeaders(request, response);
    }
  }

  // Note: We allow visiting /login and /register even if a token cookie exists.
  // This avoids confusing 307 redirects when the token is stale/invalid.

  // Otherwise, allow request and apply cache headers
  const response = NextResponse.next();
  return applyCacheHeaders(request, response);
}

// Apply cache headers based on path
function applyCacheHeaders(request, response) {
  const pathname = request.nextUrl.pathname;

  // Cache static assets aggressively
  if (pathname.startsWith('/_next/static/') || 
      pathname.startsWith('/images/') ||
      pathname.startsWith('/icons/') ||
      pathname.startsWith('/fonts/')) {
    response.headers.set(
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
      response.headers.set(
        'Cache-Control',
        'public, s-maxage=60, stale-while-revalidate=300'
      );
    }
    // User-specific endpoints - no cache
    else if (pathname.startsWith('/api/user') || 
             pathname.startsWith('/api/cart') ||
             pathname.startsWith('/api/orders')) {
      response.headers.set(
        'Cache-Control',
        'private, no-cache, no-store, must-revalidate'
      );
    }
    // Default API cache
    else {
      response.headers.set(
        'Cache-Control',
        'public, s-maxage=30, stale-while-revalidate=60'
      );
    }
  }

  return response;
}

// ✅ Apply only to auth-related paths
export const config = {
  matcher: [
    '/check-out-delivery/:path*',
    '/user-account/:path*',
    '/orders/:path*',
    '/login',
    '/register',
    '/',
  ],
};
