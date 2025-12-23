// Category name translation mapping
// Maps common category names to translation keys

const categoryNameMap = {
  // Exact matches
  'Kitchenware': 'categories.kitchenware',
  'Headphones': 'categories.headphones',
  'Smart Watches': 'categories.smartWatches',
  'Laptops': 'categories.laptops',
  'Mobile Phones': 'categories.mobilePhones',
  'Tablets': 'categories.tablets',
  'Cameras': 'categories.cameras',
  'Gaming': 'categories.gaming',
  'Audio': 'categories.audio',
  'Wearables': 'categories.wearables',
  'Accessories': 'categories.accessories',
  'Computers': 'categories.computers',
  'Electronics': 'categories.electronics',
  'Phones': 'categories.phones',
  'Watches': 'categories.watches',
  
  // Case-insensitive variations
  'kitchenware': 'categories.kitchenware',
  'headphones': 'categories.headphones',
  'smart watches': 'categories.smartWatches',
  'smartwatches': 'categories.smartWatches',
  'laptops': 'categories.laptops',
  'mobile phones': 'categories.mobilePhones',
  'mobilephones': 'categories.mobilePhones',
  'tablets': 'categories.tablets',
  'cameras': 'categories.cameras',
  'gaming': 'categories.gaming',
  'audio': 'categories.audio',
  'wearables': 'categories.wearables',
  'accessories': 'categories.accessories',
  'computers': 'categories.computers',
  'electronics': 'categories.electronics',
  'phones': 'categories.phones',
  'watches': 'categories.watches',
  
  // Additional common variations
  'Mobile': 'categories.mobilePhones',
  'Phone': 'categories.phones',
  'Laptop': 'categories.laptops',
  'Computer': 'categories.computers',
  'Headphone': 'categories.headphones',
  'Watch': 'categories.watches',
  'Smart Watch': 'categories.smartWatches',
  'Tablet': 'categories.tablets',
  'Camera': 'categories.cameras',
  'Kitchen': 'categories.kitchenware',
  'Kitchen Ware': 'categories.kitchenware',
};

/**
 * Get translation key for a category name
 * @param {string} categoryName - The category name from API
 * @returns {string} Translation key or null if not found
 */
export function getCategoryTranslationKey(categoryName) {
  if (!categoryName) return null;
  
  // Try exact match first
  if (categoryNameMap[categoryName]) {
    return categoryNameMap[categoryName];
  }
  
  // Try case-insensitive match
  const lowerName = categoryName.toLowerCase().trim();
  for (const [key, value] of Object.entries(categoryNameMap)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  // Try partial match (contains)
  for (const [key, value] of Object.entries(categoryNameMap)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Translate category name using the translation function
 * @param {string} categoryName - The category name from API
 * @param {Function} t - Translation function from useI18n
 * @returns {string} Translated name or original if translation not found
 */
export function translateCategoryName(categoryName, t) {
  if (!categoryName || !t) return categoryName;
  
  const translationKey = getCategoryTranslationKey(categoryName);
  if (translationKey) {
    const translated = t(translationKey);
    // If translation returns the key, it means translation not found, return original
    return translated !== translationKey ? translated : categoryName;
  }
  
  return categoryName;
}

