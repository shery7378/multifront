/**
 * Client-side caching utilities
 * Provides in-memory cache for API responses and computed values
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired entries
   */
  clean(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const memoryCache = new MemoryCache();

// Clean expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    memoryCache.clean();
  }, 5 * 60 * 1000);
}

/**
 * Create a cached fetch function
 */
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  const cacheKey = `fetch:${url}:${JSON.stringify(options)}`;
  
  // Check cache first
  const cached = memoryCache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Fetch from network
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Store in cache
  memoryCache.set(cacheKey, data, ttl);
  
  return data;
}

/**
 * Cache key generators
 */
export const cacheKeys = {
  products: (filters?: any) => `products:${JSON.stringify(filters || {})}`,
  stores: (filters?: any) => `stores:${JSON.stringify(filters || {})}`,
  categories: () => 'categories',
  user: (id: string) => `user:${id}`,
  cart: (userId: string) => `cart:${userId}`,
};

