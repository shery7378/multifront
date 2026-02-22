/**
 * Helper utility to generate absolute URLs for backend storage assets.
 * 
 * @param {string} path - The relative path to the storage asset (e.g., '/storage/images/logo.png')
 * @returns {string} The full absolute URL pointing to the backend
 */
export const getStorageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Already absolute

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${cleanBase}${cleanPath}`;
};

/**
 * Robust helper to get a product's image URL with fallbacks and construction logic.
 * 
 * @param {Object} product - The product object
 * @returns {string} The image URL (relative path for same-origin proxying)
 */
export const getProductImageUrl = (product) => {
  if (!product) return '/images/NoImageLong.jpg';
  
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://api.multikonnect.com').replace(/\/$/, '');
  
  let imageUrl = null;

  // 1. Try common image fields
  if (product.featured_image?.url) {
    imageUrl = product.featured_image.url;
    console.log(`✅ [urlHelpers] Found in featured_image.url:`, imageUrl);
  } else if (product.base_image?.url) {
    imageUrl = product.base_image.url;
    console.log(`✅ [urlHelpers] Found in base_image.url:`, imageUrl);
  } else if (Array.isArray(product.images) && product.images.length > 0) {
    const first = product.images[0];
    imageUrl = typeof first === 'string' ? first : (first?.url || first?.path);
    console.log(`✅ [urlHelpers] Found in images array:`, imageUrl);
  } else {
    imageUrl = product.image || product.image_url || product.thumbnail;
    if (imageUrl) console.log(`✅ [urlHelpers] Found in direct field (image/image_url/thumbnail):`, imageUrl);
  }

  // 2. Fallback to construction based on ID if no field found
  if (!imageUrl && product.id) {
    imageUrl = `${apiBase}/storage/images/products/${product.id}/product_${product.id}_0.jpg`;
    console.warn(`⚠️ [urlHelpers] No image data from API for product ${product.id}. Using speculative construction:`, imageUrl);
  }

  // 3. Last fallback to placeholder
  if (!imageUrl) {
    console.warn(`❌ [urlHelpers] No image data OR product ID for:`, product?.name || 'Unknown Product');
    return '/images/NoImageLong.jpg';
  }

  // 4. Clean up and handle proxying
  let s = String(imageUrl).trim();
  
  if (s.startsWith('http')) {
    if (s.startsWith(apiBase)) {
      // Convert to relative for Next.js proxy
      s = s.replace(apiBase, '');
    } else {
      // External URL, use as-is
      return s;
    }
  }

  // Ensure leading slash
  return s.startsWith('/') ? s : `/${s}`;
};

