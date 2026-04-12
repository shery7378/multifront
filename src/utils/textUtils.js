/**
 * Utility functions for safe text/string handling
 */

/**
 * Safely convert any value to string, handling objects with language keys
 * @param {*} value - Value to convert (could be string, object, null, etc.)
 * @param {string} defaultValue - Default fallback value
 * @returns {string} - Safe string representation
 */
export function toSafeString(value, defaultValue = '') {
    if (!value) return defaultValue;

    // If it's already a string, return it
    if (typeof value === 'string') return value;

    // Handle objects with language keys (e.g., {en: 'English', ar: 'Arabic'})
    if (typeof value === 'object' && !Array.isArray(value)) {
        // Try common language keys first
        if (value.en) return String(value.en);
        if (value.ar) return String(value.ar);
        if (value.fr) return String(value.fr);

        // Otherwise get first available value
        const keys = Object.keys(value);
        if (keys.length > 0 && value[keys[0]]) {
            return String(value[keys[0]]);
        }
    }

    // For numbers, booleans, etc., convert to string
    if (value != null) {
        return String(value);
    }

    return defaultValue;
}

/**
 * Extract text from a product attribute that might be multi-language or array
 * @param {*} value - The attribute value
 * @returns {string} - Safe string or empty string
 */
export function extractProductText(value) {
    return toSafeString(value, '');
}

/**
 * Safely render an array of items, handling both string and object elements
 * @param {Array} items - Array of items
 * @param {string} format - How to format (can be 'join' for comma-separated, 'array' for array)
 * @returns {string|Array} - Formatted items
 */
export function safeFormatArray(items, format = 'join') {
    if (!Array.isArray(items)) {
        return format === 'join' ? extractProductText(items) : [extractProductText(items)];
    }

    const safeItems = items.map(item => extractProductText(item));

    return format === 'join' ? safeItems.join(', ') : safeItems;
}
