/**
 * API utility for managing favorites (products and stores)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Get authentication token from localStorage or cookies
 */
function getAuthToken() {
  if (typeof window === 'undefined') return null;
  
  // Try to get token from localStorage
  const token = localStorage.getItem('auth_token') || 
                localStorage.getItem('token') ||
                localStorage.getItem('sanctum_token');
  
  return token;
}

/**
 * Make authenticated API request
 */
async function apiRequest(url, options = {}) {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Product Favorites
 */
export const productFavorites = {
  /**
   * Get all favorite product IDs
   */
  async getAll() {
    try {
      const response = await apiRequest('/api/favorites/products');
      console.log('✅ [FavoritesAPI] getAll response:', response);
      const ids = response.data || [];
      console.log('✅ [FavoritesAPI] Favorite product IDs:', ids);
      return Array.isArray(ids) ? ids : [];
    } catch (error) {
      console.error('❌ [FavoritesAPI] Error getting favorite products:', error);
      // Return empty array if not authenticated (fallback to localStorage)
      return [];
    }
  },

  /**
   * Add product to favorites
   */
  async add(productId) {
    try {
      await apiRequest('/api/favorites/products/add', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId }),
      });
      return true;
    } catch (error) {
      console.error('Error adding favorite product:', error);
      // Fallback to localStorage if not authenticated
      if (typeof window !== 'undefined') {
        try {
          const saved = JSON.parse(localStorage.getItem('favorites') || '{}');
          saved[String(productId)] = true;
          localStorage.setItem('favorites', JSON.stringify(saved));
        } catch {}
      }
      return false;
    }
  },

  /**
   * Remove product from favorites
   */
  async remove(productId) {
    try {
      await apiRequest('/api/favorites/products/remove', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId }),
      });
      return true;
    } catch (error) {
      console.error('Error removing favorite product:', error);
      // Fallback to localStorage if not authenticated
      if (typeof window !== 'undefined') {
        try {
          const saved = JSON.parse(localStorage.getItem('favorites') || '{}');
          delete saved[String(productId)];
          localStorage.setItem('favorites', JSON.stringify(saved));
        } catch {}
      }
      return false;
    }
  },

  /**
   * Check if product is favorited
   */
  async check(productId) {
    try {
      const response = await apiRequest(`/api/favorites/products/check?product_id=${productId}`);
      console.log('✅ [FavoritesAPI] Check response:', { productId, response, isFavorite: response.is_favorite });
      
      // If API says it's favorited, return true
      if (response.is_favorite === true || response.is_favorite === 1) {
        return true;
      }
      
      // If API says not favorited but user might not be authenticated, check localStorage
      if (response.success && response.is_favorite === false) {
        // Still check localStorage as backup
        if (typeof window !== 'undefined') {
          try {
            const saved = JSON.parse(localStorage.getItem('favorites') || '{}');
            const isFav = !!saved[String(productId)];
            if (isFav) {
              console.log('💾 [FavoritesAPI] Found in localStorage (not in DB):', { productId });
              return true;
            }
          } catch (e) {
            console.error('❌ [FavoritesAPI] Error reading localStorage:', e);
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ [FavoritesAPI] Error checking favorite product:', error);
      // Fallback to localStorage if API fails
      if (typeof window !== 'undefined') {
        try {
          const saved = JSON.parse(localStorage.getItem('favorites') || '{}');
          const isFav = !!saved[String(productId)];
          console.log('💾 [FavoritesAPI] Fallback to localStorage:', { productId, isFav });
          return isFav;
        } catch (e) {
          console.error('❌ [FavoritesAPI] Error reading localStorage:', e);
        }
      }
      return false;
    }
  },
};

/**
 * Store Favorites
 */
export const storeFavorites = {
  /**
   * Get all favorite store IDs
   */
  async getAll() {
    try {
      const response = await apiRequest('/api/favorites/stores');
      console.log('✅ [FavoritesAPI] getAll stores response:', response);
      const ids = response.data || [];
      console.log('✅ [FavoritesAPI] Favorite store IDs:', ids);
      return Array.isArray(ids) ? ids : [];
    } catch (error) {
      console.error('❌ [FavoritesAPI] Error getting favorite stores:', error);
      // Return empty array if not authenticated (fallback to localStorage)
      return [];
    }
  },

  /**
   * Add store to favorites
   */
  async add(storeId) {
    try {
      await apiRequest('/api/favorites/stores/add', {
        method: 'POST',
        body: JSON.stringify({ store_id: storeId }),
      });
      return true;
    } catch (error) {
      console.error('Error adding favorite store:', error);
      // Fallback to localStorage if not authenticated
      if (typeof window !== 'undefined') {
        try {
          const saved = JSON.parse(localStorage.getItem('favoriteStores') || '{}');
          saved[String(storeId)] = true;
          localStorage.setItem('favoriteStores', JSON.stringify(saved));
        } catch {}
      }
      return false;
    }
  },

  /**
   * Remove store from favorites
   */
  async remove(storeId) {
    try {
      await apiRequest('/api/favorites/stores/remove', {
        method: 'POST',
        body: JSON.stringify({ store_id: storeId }),
      });
      return true;
    } catch (error) {
      console.error('Error removing favorite store:', error);
      // Fallback to localStorage if not authenticated
      if (typeof window !== 'undefined') {
        try {
          const saved = JSON.parse(localStorage.getItem('favoriteStores') || '{}');
          delete saved[String(storeId)];
          localStorage.setItem('favoriteStores', JSON.stringify(saved));
        } catch {}
      }
      return false;
    }
  },

  /**
   * Check if store is favorited
   */
  async check(storeId) {
    try {
      const response = await apiRequest(`/api/favorites/stores/check?store_id=${storeId}`);
      return response.is_favorite || false;
    } catch (error) {
      console.error('Error checking favorite store:', error);
      // Fallback to localStorage if not authenticated
      if (typeof window !== 'undefined') {
        try {
          const saved = JSON.parse(localStorage.getItem('favoriteStores') || '{}');
          return !!saved[String(storeId)];
        } catch {}
      }
      return false;
    }
  },
};

