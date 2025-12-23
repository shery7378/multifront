/**
 * CDN Configuration for Cloudflare (and other CDNs)
 * Ready-to-use configuration for production deployment
 */

export const cdnConfig = {
  /**
   * Cloudflare-specific headers
   */
  cloudflare: {
    /**
     * Cache everything rule
     */
    cacheEverything: {
      'Cache-Control': 'public, max-age=31536000',
      'CF-Cache-Status': 'HIT',
    },

    /**
     * Cache static assets
     */
    staticAssets: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'CF-Cache-Status': 'HIT',
    },

    /**
     * Cache HTML with revalidation
     */
    htmlPages: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'CF-Cache-Status': 'DYNAMIC',
    },
  },

  /**
   * Recommended Cloudflare Page Rules
   * Apply these in Cloudflare dashboard:
   */
  pageRules: [
    {
      url: '*/_next/static/*',
      settings: {
        cache_level: 'cache_everything',
        edge_cache_ttl: 31536000,
      },
    },
    {
      url: '*/images/*',
      settings: {
        cache_level: 'cache_everything',
        edge_cache_ttl: 86400,
      },
    },
    {
      url: '*/api/*',
      settings: {
        cache_level: 'bypass',
      },
    },
  ],

  /**
   * Cloudflare Workers script (optional)
   * Deploy this to Cloudflare Workers for advanced caching
   */
  workerScript: `
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Cache static assets
  if (url.pathname.startsWith('/_next/static/') || 
      url.pathname.startsWith('/images/') ||
      url.pathname.startsWith('/icons/')) {
    const cache = caches.default;
    let response = await cache.match(request);
    
    if (!response) {
      response = await fetch(request);
      response = new Response(response.body, response);
      response.headers.set('Cache-Control', 'public, max-age=31536000');
      event.waitUntil(cache.put(request, response.clone()));
    }
    
    return response;
  }
  
  return fetch(request);
}
  `,
};

/**
 * Environment-specific CDN URLs
 */
export const getCDNUrl = (path: string): string => {
  const cdnDomain = process.env.NEXT_PUBLIC_CDN_URL || '';
  
  if (!cdnDomain) {
    return path;
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `${cdnDomain}/${cleanPath}`;
};

/**
 * Image CDN optimization
 */
export const getOptimizedImageUrl = (
  src: string,
  width?: number,
  quality: number = 80
): string => {
  // If using Cloudflare Images
  if (process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL) {
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    params.set('quality', quality.toString());
    return `${process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGES_URL}/${src}?${params}`;
  }

  // If using Next.js Image Optimization
  if (src.startsWith('/')) {
    return src; // Next.js will handle optimization
  }

  return src;
};

