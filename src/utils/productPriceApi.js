/**
 * API utility for fetching current product prices
 * Used to refresh cart item prices when viewing cart
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Get authentication token from localStorage or cookies
 */
function getAuthToken() {
    if (typeof window === 'undefined') return null;

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
        // Fail silently for price fetch - show old prices if API fails
        console.warn(`Failed to fetch product prices: ${response.status}`);
        return null;
    }

    return response.json();
}

/**
 * Fetch latest prices for multiple products
 * @param {Array} productIds - Array of product IDs
 * @returns {Promise<Object>} - Object mapping productId to price
 */
export async function fetchProductPrices(productIds) {
    if (!productIds || productIds.length === 0) {
        return {};
    }

    try {
        // Build query string with product IDs
        const queryParams = productIds.map(id => `ids[]=${id}`).join('&');

        const response = await apiRequest(`/api/products/prices?${queryParams}`);

        if (response && response.data) {
            // Convert response to { productId: price } object
            const priceMap = {};

            if (Array.isArray(response.data)) {
                // Helper to extract amount from number or object
                const getAmount = (val) => {
                    if (!val) return 0;
                    if (typeof val === 'object') {
                        return Number(val.amount || val.price || 0);
                    }
                    return Number(val);
                };

                response.data.forEach(product => {
                    if (product && product.id) {
                        const chosenPrice = getAmount(product.price) || getAmount(product.price_tax_excl) || 0;
                        priceMap[product.id] = {
                            price: chosenPrice,
                            name: product.name
                        };
                    }
                });
            } else {
                return response.data;
            }

            return priceMap;
        }
    } catch (error) {
        // Silently fail - product price refresh is optional and should not break the cart experience
        console.debug('Product prices refresh unavailable (non-critical):', error.message);
    }

    return {};
}

/**
 * Fetch a single product with latest price information
 * @param {Number|String} productId - Product ID
 * @returns {Promise<Object|null>} - Product object with current price or null
 */
export async function fetchProductPrice(productId) {
    if (!productId) {
        return null;
    }

    try {
        const response = await apiRequest(`/api/products/${productId}`);

        if (response && response.data) {
            const getAmount = (val) => {
                if (!val) return 0;
                if (typeof val === 'object') return Number(val.amount || val.price || 0);
                return Number(val);
            };

            return {
                id: response.data.id,
                name: response.data.name,
                price: getAmount(response.data.price) || getAmount(response.data.price_tax_excl) || 0,
            };
        }
    } catch (error) {
        console.warn(`Error fetching product ${productId} price:`, error);
    }

    return null;
}

/**
 * Fetch prices for cart items and return mapping of productId to new price
 * @param {Array} cartItems - Cart items from Redux
 * @returns {Promise<Object>} - Object mapping productId to price
 */
export async function fetchCartItemPrices(cartItems) {
    if (!cartItems || cartItems.length === 0) {
        return {};
    }

    // Extract unique product IDs
    const productIds = [...new Set(cartItems.map(item => item.id))];

    return fetchProductPrices(productIds);
}
