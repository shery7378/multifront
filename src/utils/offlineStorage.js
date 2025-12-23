/**
 * IndexedDB utility for offline data storage
 * Provides persistent storage for cart, favorites, and other offline data
 */

const DB_NAME = 'multikonnect-offline';
const DB_VERSION = 1;

// Store names
const STORES = {
  CART: 'cart',
  FAVORITES: 'favorites',
  RECENTLY_VIEWED: 'recentlyViewed',
  OFFLINE_QUEUE: 'offlineQueue',
  USER_DATA: 'userData',
};

let dbInstance = null;

/**
 * Initialize IndexedDB
 */
export async function initDB() {
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IndexedDB] Failed to open database');
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Cart store
      if (!db.objectStoreNames.contains(STORES.CART)) {
        const cartStore = db.createObjectStore(STORES.CART, { keyPath: 'id', autoIncrement: true });
        cartStore.createIndex('productId', 'productId', { unique: false });
        cartStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Favorites store
      if (!db.objectStoreNames.contains(STORES.FAVORITES)) {
        const favoritesStore = db.createObjectStore(STORES.FAVORITES, { keyPath: 'productId' });
        favoritesStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Recently viewed store
      if (!db.objectStoreNames.contains(STORES.RECENTLY_VIEWED)) {
        const recentlyViewedStore = db.createObjectStore(STORES.RECENTLY_VIEWED, { keyPath: 'productId' });
        recentlyViewedStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Offline queue store (for actions to sync when online)
      if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('type', 'type', { unique: false });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('status', 'status', { unique: false });
      }

      // User data store (for caching user-specific data)
      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        const userDataStore = db.createObjectStore(STORES.USER_DATA, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Get database instance
 */
async function getDB() {
  if (!dbInstance) {
    await initDB();
  }
  return dbInstance;
}

/**
 * Generic function to add item to a store
 */
export async function addToStore(storeName, item) {
  try {
    const db = await getDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Add timestamp if not present
    if (!item.timestamp) {
      item.timestamp = Date.now();
    }
    
    return store.add(item);
  } catch (error) {
    console.error(`[IndexedDB] Error adding to ${storeName}:`, error);
    throw error;
  }
}

/**
 * Generic function to get all items from a store
 */
export async function getAllFromStore(storeName) {
  try {
    const db = await getDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    return store.getAll();
  } catch (error) {
    console.error(`[IndexedDB] Error getting from ${storeName}:`, error);
    return [];
  }
}

/**
 * Generic function to get item by key
 */
export async function getFromStore(storeName, key) {
  try {
    const db = await getDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    return store.get(key);
  } catch (error) {
    console.error(`[IndexedDB] Error getting from ${storeName}:`, error);
    return null;
  }
}

/**
 * Generic function to delete item from store
 */
export async function deleteFromStore(storeName, key) {
  try {
    const db = await getDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return store.delete(key);
  } catch (error) {
    console.error(`[IndexedDB] Error deleting from ${storeName}:`, error);
    throw error;
  }
}

/**
 * Generic function to clear a store
 */
export async function clearStore(storeName) {
  try {
    const db = await getDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return store.clear();
  } catch (error) {
    console.error(`[IndexedDB] Error clearing ${storeName}:`, error);
    throw error;
  }
}

/**
 * Cart operations
 */
export const cartStorage = {
  async add(item) {
    return addToStore(STORES.CART, { ...item, productId: item.id || item.productId });
  },

  async getAll() {
    return getAllFromStore(STORES.CART);
  },

  async remove(id) {
    return deleteFromStore(STORES.CART, id);
  },

  async clear() {
    return clearStore(STORES.CART);
  },

  async update(id, updates) {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORES.CART], 'readwrite');
      const store = transaction.objectStore(STORES.CART);
      const item = await store.get(id);
      if (item) {
        Object.assign(item, updates);
        return store.put(item);
      }
    } catch (error) {
      console.error('[IndexedDB] Error updating cart item:', error);
      throw error;
    }
  },
};

/**
 * Favorites operations
 */
export const favoritesStorage = {
  async add(productId, productData = null) {
    return addToStore(STORES.FAVORITES, {
      productId,
      productData,
      timestamp: Date.now(),
    });
  },

  async getAll() {
    return getAllFromStore(STORES.FAVORITES);
  },

  async remove(productId) {
    return deleteFromStore(STORES.FAVORITES, productId);
  },

  async has(productId) {
    const item = await getFromStore(STORES.FAVORITES, productId);
    return !!item;
  },

  async clear() {
    return clearStore(STORES.FAVORITES);
  },
};

/**
 * Recently viewed operations
 */
export const recentlyViewedStorage = {
  async add(productId, productData = null) {
    // Remove old entry if exists
    try {
      await deleteFromStore(STORES.RECENTLY_VIEWED, productId);
    } catch (e) {
      // Ignore if doesn't exist
    }
    
    return addToStore(STORES.RECENTLY_VIEWED, {
      productId,
      productData,
      timestamp: Date.now(),
    });
  },

  async getAll(limit = 20) {
    const items = await getAllFromStore(STORES.RECENTLY_VIEWED);
    // Sort by timestamp descending and limit
    return items
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },

  async clear() {
    return clearStore(STORES.RECENTLY_VIEWED);
  },
};

/**
 * Offline queue operations (for syncing actions when online)
 */
export const offlineQueue = {
  async add(action) {
    return addToStore(STORES.OFFLINE_QUEUE, {
      ...action,
      status: 'pending',
      timestamp: Date.now(),
    });
  },

  async getAll() {
    return getAllFromStore(STORES.OFFLINE_QUEUE);
  },

  async getPending() {
    const all = await getAllFromStore(STORES.OFFLINE_QUEUE);
    return all.filter((item) => item.status === 'pending');
  },

  async markComplete(id) {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORES.OFFLINE_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.OFFLINE_QUEUE);
      const item = await store.get(id);
      if (item) {
        item.status = 'completed';
        item.completedAt = Date.now();
        return store.put(item);
      }
    } catch (error) {
      console.error('[IndexedDB] Error marking queue item complete:', error);
      throw error;
    }
  },

  async remove(id) {
    return deleteFromStore(STORES.OFFLINE_QUEUE, id);
  },

  async clear() {
    return clearStore(STORES.OFFLINE_QUEUE);
  },
};

/**
 * User data operations (for caching user-specific data)
 */
export const userDataStorage = {
  async set(key, value) {
    try {
      const db = await getDB();
      const transaction = db.transaction([STORES.USER_DATA], 'readwrite');
      const store = transaction.objectStore(STORES.USER_DATA);
      return store.put({ key, value, timestamp: Date.now() });
    } catch (error) {
      console.error('[IndexedDB] Error setting user data:', error);
      throw error;
    }
  },

  async get(key) {
    const item = await getFromStore(STORES.USER_DATA, key);
    return item ? item.value : null;
  },

  async remove(key) {
    return deleteFromStore(STORES.USER_DATA, key);
  },

  async clear() {
    return clearStore(STORES.USER_DATA);
  },
};

/**
 * Initialize database on module load (if in browser)
 */
if (typeof window !== 'undefined') {
  initDB().catch((error) => {
    console.warn('[IndexedDB] Initialization failed (may not be available):', error);
  });
}

