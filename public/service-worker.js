// Service Worker for MultiKonnect PWA
// Handles offline caching and network strategies
// Integrated with OneSignal for push notifications

// Import OneSignal SDK if available
try {
  importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');
} catch (e) {
  console.log('[Service Worker] OneSignal SDK not available, continuing without it');
}

const CACHE_NAME = 'multikonnect-v2';
const RUNTIME_CACHE = 'multikonnect-runtime-v2';
const IMAGE_CACHE = 'multikonnect-images-v2';
const API_CACHE = 'multikonnect-api-v2';

// Assets to cache immediately on install (app shell)
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/home',
  '/browse-stores',
  '/images/store-logo.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/fonts/bricle-regular.otf',
  '/fonts/bricle-italic.otf',
];

// Pages that should work offline (cache on first visit)
const OFFLINE_PAGES = [
  '/',
  '/home',
  '/browse-stores',
  '/products',
  '/cart',
  '/favorites',
  '/orders',
  '/user-account',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[Service Worker] Caching app shell');
        // Use addAll but catch individual failures
        return Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[Service Worker] Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      }),
      caches.open(IMAGE_CACHE),
      caches.open(API_CACHE),
      caches.open(RUNTIME_CACHE),
    ]).then(() => {
      console.log('[Service Worker] Installation complete');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const validCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE, API_CACHE];
      return Promise.all(
        cacheNames
          .filter((cacheName) => !validCaches.includes(cacheName))
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => {
      console.log('[Service Worker] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests (except for images from trusted domains)
  if (url.origin !== location.origin) {
    // Allow caching images from external domains (e.g., product images from API)
    if (request.method === 'GET' && isImageRequest(request)) {
      event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    }
    return;
  }

  // Skip non-GET requests (POST, PUT, DELETE) - these will be queued for background sync
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests with stale-while-revalidate strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidateStrategy(request, API_CACHE));
    return;
  }

  // Handle images with cache-first strategy
  if (isImageRequest(request)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Handle static assets (JS, CSS, fonts) with cache-first strategy
  if (
    url.pathname.match(/\.(js|css|woff|woff2|ttf|otf|ico)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
    return;
  }

  // Handle navigation requests (page requests)
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirstStrategy(request, RUNTIME_CACHE)
        .then((response) => {
          // Cache successful page responses
          if (response && response.status === 200) {
            const cacheUrl = url.pathname;
            if (OFFLINE_PAGES.some((page) => cacheUrl.startsWith(page))) {
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, response.clone());
              });
            }
          }
          return response;
        })
        .catch(() => {
          // Try to get cached version of the page
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Fallback to offline page
              return caches.match('/offline') || caches.match('/');
            });
        })
    );
    return;
  }

  // Default: network-first strategy
  event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
});

// Helper: Check if request is for an image
function isImageRequest(request) {
  const url = new URL(request.url);
  return (
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/i) ||
    request.headers.get('accept')?.includes('image/')
  );
}

// Network-first strategy: try network, fallback to cache
async function networkFirstStrategy(request, cacheName = RUNTIME_CACHE) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses (200-299)
    if (networkResponse && networkResponse.status >= 200 && networkResponse.status < 300) {
      const cache = await caches.open(cacheName);
      // Clone response before caching (responses can only be read once)
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache-first strategy: try cache, fallback to network
async function cacheFirstStrategy(request, cacheName = CACHE_NAME) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background (don't wait for it)
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(cacheName).then((cache) => {
            cache.put(request, networkResponse.clone());
          });
        }
      })
      .catch(() => {
        // Ignore network errors in background update
      });
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Cache and network failed:', request.url);
    throw error;
  }
}

// Stale-while-revalidate strategy: return cached immediately, update in background
async function staleWhileRevalidateStrategy(request, cacheName = API_CACHE) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch fresh data in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // If network fails, we'll use cached version
      return null;
    });
  
  // Return cached version immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Push notification handler (existing functionality)
self.addEventListener('push', function(event) {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'MultiKonnect';
    const options = {
      body: data.body || 'You have a new update',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      data: data.data || {},
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('[Service Worker] Push notification error:', e);
    event.waitUntil(
      self.registration.showNotification('MultiKonnect', {
        body: 'You have a new update',
        icon: '/icons/icon-192x192.png',
      })
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = (event.notification && event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Background sync for offline actions (when browser supports it)
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync offline actions when connection is restored
async function syncOfflineActions() {
  try {
    // Get offline queue from IndexedDB (if implemented)
    // For now, just log that sync was triggered
    console.log('[Service Worker] Syncing offline actions...');
    
    // In a full implementation, you would:
    // 1. Read queued actions from IndexedDB
    // 2. Send them to the server
    // 3. Remove successful actions from queue
    // 4. Notify the client about sync status
    
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Error syncing offline actions:', error);
    return Promise.reject(error);
  }
}

// Message handler for communication with clients
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return Promise.all(
          event.data.urls.map((url) => {
            return fetch(url)
              .then((response) => {
                if (response.status === 200) {
                  return cache.put(url, response);
                }
              })
              .catch(() => {
                // Ignore failures
              });
          })
        );
      })
    );
  }
});

