// src/utils/cartUtils.js

/**
 * Groups cart items by store
 * @param {Array} items - Cart items
 * @returns {Object} - Items grouped by store ID { storeId: { store, items: [...] } }
 */
export const groupItemsByStore = (items) => {
  const grouped = {};
  
  items.forEach(item => {
    // Try to get store from multiple possible locations (priority order)
    let store = item.store || null;
    
    // If store is not at top level, try to get it from product
    if (!store && item.product?.store) {
      const productStore = item.product.store;
      // Handle if store is an array
      if (Array.isArray(productStore) && productStore.length > 0) {
        store = productStore[0]; // Take first store from array
      } else if (typeof productStore === 'object' && !Array.isArray(productStore)) {
        store = productStore; // It's already an object
      }
    }
    
    // Fallback to vendor if no store found
    if (!store && item.product?.vendor) {
      store = item.product.vendor;
    }
    
    // Try to get store ID from multiple possible locations
    let storeId = item.storeId ||
                  item.store_id ||
                  store?.id || 
                  store?.store_id || 
                  item.product?.store_id || 
                  item.product?.vendor_id ||
                  null;
    
    // If we have a storeId but no store object, try to get store from product data
    if (!store && storeId && storeId !== 'unknown' && item.product) {
      // Check if product has store data that matches the storeId
      if (item.product.store) {
        const productStore = Array.isArray(item.product.store) 
          ? item.product.store.find(s => s.id === storeId || s.store_id === storeId)
          : (item.product.store.id === storeId || item.product.store.store_id === storeId ? item.product.store : null);
        if (productStore) {
          store = productStore;
        }
      }
    }
    
    // If we still don't have a store but have a storeId, try to construct a minimal store object
    if (!store && storeId && storeId !== 'unknown') {
      store = { id: storeId };
    }
    
    // Default to 'unknown' if no store ID found
    if (!storeId) {
      storeId = 'unknown';
    }
    
    if (!grouped[storeId]) {
      grouped[storeId] = {
        store: store,
        items: [],
      };
    }
    
    grouped[storeId].items.push(item);
  });
  
  // Debug: Log grouped stores with more details
  console.log('Grouped stores:', grouped);
  Object.keys(grouped).forEach(storeId => {
    const group = grouped[storeId];
    console.log(`Store ID: ${storeId}`, {
      hasStore: !!group.store,
      store: group.store,
      itemsCount: group.items.length,
      firstItem: group.items[0] ? {
        productId: group.items[0].product?.id,
        productStore: group.items[0].product?.store,
        itemStore: group.items[0].store,
        itemStoreId: group.items[0].storeId
      } : null
    });
  });
  
  return grouped;
};

/**
 * Checks if all stores have matching delivery slots
 * @param {Object} deliverySlots - Delivery slots by store ID { storeId: { date, time } }
 * @param {Array} storeIds - Array of store IDs to check
 * @returns {Object} - { matches: boolean, slot: { date, time } | null, mismatchedStores: Array }
 */
export const checkDeliverySlotsMatch = (deliverySlots, storeIds) => {
  if (storeIds.length === 0) {
    return { matches: true, slot: null, mismatchedStores: [] };
  }
  
  if (storeIds.length === 1) {
    const storeId = storeIds[0];
    const slot = deliverySlots[storeId];
    return {
      matches: !!slot && !!slot.date && !!slot.time,
      slot: slot || null,
      mismatchedStores: slot ? [] : [storeId],
    };
  }
  
  // Get all slots
  const slots = storeIds
    .map(storeId => ({
      storeId,
      slot: deliverySlots[storeId],
    }))
    .filter(item => item.slot && item.slot.date && item.slot.time);
  
  if (slots.length === 0) {
    return {
      matches: false,
      slot: null,
      mismatchedStores: storeIds,
    };
  }
  
  // Check if all slots match
  const firstSlot = slots[0].slot;
  const allMatch = slots.every(item => 
    item.slot.date === firstSlot.date && item.slot.time === firstSlot.time
  );
  
  if (allMatch) {
    return {
      matches: true,
      slot: firstSlot,
      mismatchedStores: [],
    };
  }
  
  // Find stores with mismatched slots
  const mismatchedStores = slots
    .filter(item => item.slot.date !== firstSlot.date || item.slot.time !== firstSlot.time)
    .map(item => item.storeId);
  
  // Also include stores without slots
  const storesWithoutSlots = storeIds.filter(
    storeId => !deliverySlots[storeId] || !deliverySlots[storeId].date || !deliverySlots[storeId].time
  );
  
  return {
    matches: false,
    slot: null,
    mismatchedStores: [...new Set([...mismatchedStores, ...storesWithoutSlots])],
  };
};

/**
 * Checks if stores are nearby (within a certain distance)
 * @param {Array} stores - Array of store objects with latitude/longitude
 * @param {number} maxDistance - Maximum distance in kilometers (default: 10)
 * @returns {boolean} - True if all stores are within maxDistance of each other
 */
export const areStoresNearby = (stores, maxDistance = 10) => {
  if (stores.length <= 1) return true;
  
  // Check if all stores have coordinates
  const storesWithCoords = stores.filter(
    store => store.latitude != null && store.longitude != null
  );
  
  if (storesWithCoords.length < stores.length) {
    // If some stores don't have coordinates, assume they're nearby if they're in the same city
    const cities = new Set(stores.map(s => s.city).filter(Boolean));
    return cities.size <= 1;
  }
  
  // Calculate distance between all pairs of stores
  for (let i = 0; i < storesWithCoords.length; i++) {
    for (let j = i + 1; j < storesWithCoords.length; j++) {
      const distance = calculateDistance(
        storesWithCoords[i].latitude,
        storesWithCoords[i].longitude,
        storesWithCoords[j].latitude,
        storesWithCoords[j].longitude
      );
      
      if (distance > maxDistance) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRad = (degrees) => degrees * (Math.PI / 180);


