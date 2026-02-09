//src/components/ProductCard.jsx
"use client";

import { FaEye, FaHeart, FaRegEye, FaRegHeart } from "react-icons/fa";
import ResponsiveText from "./UI/ResponsiveText";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useI18n } from '@/contexts/I18nContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import CountdownTimer from "./CountdownTimer";
import { productFavorites } from "@/utils/favoritesApi";
import { useDispatch, useSelector } from "react-redux";
import { addItem } from "@/store/slices/cartSlice";
import { CheckIcon } from "@heroicons/react/24/outline";
import { useGetRequest } from "@/controller/getRequests";

const ProductCard = ({ product, index, isFavorite, toggleFavorite, onPreviewClick, TotalProducts, productModal, stores = [] }) => {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [mounted, setMounted] = useState(false);
  const totalProducts = TotalProducts || 4;

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Dynamic rating state (fetched from /products/{id}/rating and cached) ---
  const initialRating = Number(product?.rating ?? 0) || 0;
  const initialReviewCount = (() => {
    if (Array.isArray(product?.reviews)) return product.reviews.length;
    if (typeof product?.review_count === 'number') return product.review_count;
    return 0;
  })();
  const [ratingData, setRatingData] = useState({
    rating: initialRating,
    reviewCount: initialReviewCount,
  });

  useEffect(() => {
    const id = product?.id;
    if (!id) return;

    // Use initial rating if provided (prefetch optimization)
    if (initialRating > 0) {
      setRatingData(prev => ({
        ...prev,
        rating: initialRating,
        // If we have review count in initial props (from backend), use it.
        // But we must be careful not to overwrite with 0 if we haven't checked for it.
        reviewCount: initialReviewCount > 0 ? initialReviewCount : prev.reviewCount
      }));
    }

    // Optimization: If we have a rating > 0 passed in props, we can likely skip the fetch
    if (initialRating > 0 && typeof window !== 'undefined' && !window.__productRatingCache?.[id]) {
      window.__productRatingCache = window.__productRatingCache || {};
      window.__productRatingCache[id] = { rating: initialRating, reviewCount: initialReviewCount };
    }

    // Simple in-memory cache on window to avoid refetching per card
    if (typeof window !== 'undefined') {
      const cache = window.__productRatingCache || {};
      if (cache[id]) {
        setRatingData(cache[id]);
        return;
      }
    }

    let cancelled = false;
    async function fetchRating() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        if (!apiBase) return;
        const res = await fetch(`${apiBase}/api/products/${id}/rating`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return;
        const json = await res.json();
        const avg = Number(json?.data?.average_rating ?? 0) || 0;
        const count = Number(json?.data?.review_count ?? 0) || 0;
        const normalized = { rating: avg, reviewCount: count };

        if (!cancelled) {
          setRatingData(normalized);
        }
        if (typeof window !== 'undefined') {
          window.__productRatingCache = {
            ...(window.__productRatingCache || {}),
            [id]: normalized,
          };
        }
      } catch {
        // fail silently; keep initial rating
      }
    }

    fetchRating();
    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  const handleProductClick = () => {
    if (product?.id) {
      // Call productModal if provided (for tracking recently viewed)
      // This should be called BEFORE navigation to ensure it executes
      if (productModal && typeof productModal === 'function') {
        try {
          productModal();
          console.log('✅ ProductModal called for product:', product.id, product.name);
        } catch (error) {
          console.error('Error calling productModal:', error);
        }
      } else {
        console.warn('⚠️ productModal not provided or not a function');
      }
      // Navigate to product page (product view will also be tracked there)
      router.push(`/product/${product.id}`);
    }
  };
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // Try multiple price fields as fallback
  const basePrice = Number(
    product?.price_tax_excl || 
    product?.price || 
    product?.unit_price || 
    product?.final_price || 
    0
  );
  const flashPrice = product?.flash_price != null ? Number(product.flash_price) : null;
  const comparePrice = Number(product?.compared_price || product?.compare_price || 0);

  const displayPrice = flashPrice != null ? flashPrice : basePrice;
  const originalForCompare = flashPrice != null ? basePrice : comparePrice;
  const hasStrike = (flashPrice != null && basePrice > flashPrice) || (!!comparePrice && comparePrice > basePrice);
  const discount = (() => {
    const from = flashPrice != null ? basePrice : comparePrice;
    const to = displayPrice;
    if (!from || from <= 0 || to >= from) return null;
    return Math.round(((from - to) / from) * 100);
  })();

  const effectiveRating = Number.isFinite(ratingData.rating) ? ratingData.rating : 0;
  const effectiveReviewCount = Number.isFinite(ratingData.reviewCount) ? ratingData.reviewCount : 0;

  return (
    <>
      {/* Success Message Toast - Rendered via Portal */}
      {mounted && typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed top-4 right-4 z-[9999] bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm sm:text-base max-w-sm"
            >
              <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Product added to cart successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        whileHover={{
          scale: 1.03,
          y: -4,
          transition: {
            type: "spring",
            stiffness: 150,
            damping: 15,
            mass: 0.5,
          },
        }} className="flex-shrink-0 w-[270px] h-[250px] rounded-[4px]">
        <div
          className="bg-white rounded-[4px] px-1 sm:px-0 cursor-pointer h-full flex flex-col"
          onClick={handleProductClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleProductClick(); } }}
          role="button"
          tabIndex={0}
        >
          {/* Image + Actions */}
          <div
            className="relative grid items-end bg-cultured h-[180px] group rounded-[4px] overflow-hidden cursor-pointer flex-shrink-0"
            onClick={handleProductClick}
          >
            {/* Discount badge */}
            {typeof discount === 'number' && discount > 0 && (
              <span className="absolute top-3 left-3 bg-jasper text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {discount}%
              </span>
            )}

            {/* Favorite & Preview */}
            <div className="absolute top-3 right-3 gap-2 grid">
              <span
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!product?.id) return;

                  try {
                    const productId = product.id;
                    const wasFavorite = isFavorite;

                    // Update UI immediately (optimistic update)
                    toggleFavorite(index);

                    // Save to database (with localStorage fallback)
                    if (wasFavorite) {
                      await productFavorites.remove(productId);
                      console.log('❌ [ProductCard] Removed favorite from database:', { productId });
                    } else {
                      await productFavorites.add(productId);
                      console.log('✅ [ProductCard] Added favorite to database:', { productId });
                    }

                    // Also update localStorage as backup
                    try {
                      const key = String(productId);
                      const saved = JSON.parse(localStorage.getItem('favorites') || '{}');
                      if (wasFavorite) {
                        delete saved[key];
                      } else {
                        saved[key] = true;
                      }
                      localStorage.setItem('favorites', JSON.stringify(saved));
                    } catch { }

                    // Dispatch event to refresh recommendations
                    if (typeof window !== 'undefined') {
                      const event = new CustomEvent('favoriteUpdated', {
                        detail: { productId, isFavorite: !wasFavorite }
                      });
                      window.dispatchEvent(event);
                    }
                  } catch (err) {
                    console.error('❌ [ProductCard] Error toggling favorite:', err);
                    // Revert UI on error
                    toggleFavorite(index);
                  }
                }}
                className={`w-9 h-9 rounded-full border bg-white flex items-center justify-center 
            transition cursor-pointer hover:border-vivid-red hover:shadow-[0_0_6px_#ef4444] 
            ${isFavorite ? "border-vivid-red" : "border-gray-200"}`}
              >
                {isFavorite ? (
                  <FaHeart className="text-vivid-red" />
                ) : (
                  <FaRegHeart className="text-gray-600" />
                )}
              </span>
              {/* <span
                onClick={() => onPreviewClick(product.image, product.name)}
                className="w-8 h-8 rounded-full border bg-white border-gray-200 flex items-center justify-center hover:border-vivid-red hover:shadow-[0_0_10px_#ef4444] transition cursor-pointer"
              >
                <FaEye className="text-black" />
              </span> */}
            </div>

            {/* Product image */}
            <div className="flex flex-col items-center justify-center h-full cursor-pointer" onClick={handleProductClick}>
              <div className="w-full h-full flex items-center justify-center p-4">
                <img
                  src={(() => {
                    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
                    // Try multiple image fields as fallback
                    let imageUrl = null;
                    
                    // Check featured_image.url first
                    if (product?.featured_image?.url) {
                      imageUrl = product.featured_image.url;
                    }
                    // Check base_image
                    else if (product?.base_image) {
                      if (typeof product.base_image === 'string') {
                        imageUrl = product.base_image;
                      } else if (product.base_image.url) {
                        imageUrl = product.base_image.url;
                      } else if (product.base_image.path) {
                        imageUrl = product.base_image.path;
                      }
                    }
                    // Check images array
                    else if (Array.isArray(product?.images) && product.images.length > 0) {
                      imageUrl = product.images[0]?.url || product.images[0]?.path || product.images[0];
                    }
                    // Check direct image fields
                    else if (product?.image_url) {
                      imageUrl = product.image_url;
                    }
                    else if (product?.image) {
                      imageUrl = product.image;
                    }
                    else if (product?.thumbnail) {
                      imageUrl = product.thumbnail;
                    }
                    
                    // If we have an image URL, format it properly
                    if (imageUrl) {
                      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                        return imageUrl;
                      }
                      if (imageUrl.startsWith('data:')) {
                        return imageUrl;
                      }
                      // Remove leading slash if present and prepend API base URL
                      return `${apiBase}/${imageUrl.replace(/^\//, '')}`;
                    }
                    
                    // Fallback to placeholder
                    return '/images/NoImageLong.jpg';
                  })()}
                  alt={product.name || 'Product image'}
                  className="w-full h-full object-cover pointer-events-none"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.target.src = '/images/NoImageLong.jpg';
                  }}
                />
              </div>

              {/* Add to Cart (on hover) */}
              <button
                className="mt-3 cursor-pointer text-sm w-full font-semibold bg-vivid-red text-white py-2 
            rounded-b-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300"
                onClick={async (e) => {
                  e.stopPropagation();
                    // If user is authenticated, add to cart directly
                  if (token) {
                    const numericBase = Number(
                      product?.price_tax_excl || 
                      product?.price || 
                      product?.unit_price || 
                      product?.final_price || 
                      0
                    );
                    const numericFlash = product?.flash_price != null ? Number(product.flash_price) : null;
                    const chosenPrice = Number.isFinite(numericFlash) ? numericFlash : numericBase;

                    // Handle store - could be object, array, or null
                    let storeInfo = null;
                    if (product.store) {
                      if (Array.isArray(product.store) && product.store.length > 0) {
                        storeInfo = product.store[0]; // Take first store if array
                      } else if (typeof product.store === 'object' && !Array.isArray(product.store)) {
                        storeInfo = product.store; // It's already an object
                      }
                    }

                    // If store info is missing, try to find it in the stores list passed as prop
                    if (!storeInfo && stores && stores.length > 0) {
                      const storeId = product.store_id || product.vendor_id || product.vendor?.id;
                      const vendorUserId = product.vendor?.user_id || product.user_id;

                      // Try to find by store ID first
                      if (storeId) {
                        storeInfo = stores.find(s =>
                          s.id === storeId ||
                          s.store_id === storeId ||
                          String(s.id) === String(storeId)
                        );
                      }

                      // If not found, try by vendor user_id matching store user_id
                      if (!storeInfo && vendorUserId) {
                        storeInfo = stores.find(s =>
                          s.user_id === vendorUserId ||
                          String(s.user_id) === String(vendorUserId)
                        );
                      }
                    }

                    // If still no store info, fetch full product details which should include store
                    if (!storeInfo && product.id) {
                      try {
                        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
                        const response = await fetch(`${apiBase}/api/products/${product.id}`);
                        if (response.ok) {
                          const productData = await response.json();
                          const fullProduct = productData?.data || productData;

                          // Try to extract store from full product
                          if (fullProduct.store) {
                            if (Array.isArray(fullProduct.store) && fullProduct.store.length > 0) {
                              storeInfo = fullProduct.store[0];
                            } else if (typeof fullProduct.store === 'object' && !Array.isArray(fullProduct.store)) {
                              storeInfo = fullProduct.store;
                            }
                          } else if (fullProduct.store_id && stores && stores.length > 0) {
                            // If we have store_id, try to find it in the stores list
                            storeInfo = stores.find(s =>
                              s.id === fullProduct.store_id ||
                              String(s.id) === String(fullProduct.store_id)
                            );
                          }
                        }
                      } catch (error) {
                        console.error('Error fetching product details:', error);
                      }
                    }

                    const payload = {
                      id: product.id,
                      product: product,
                      price: chosenPrice,
                      quantity: 1,
                      // Include store at top level if we have valid store info
                      ...(storeInfo && { store: storeInfo }),
                      // Also try to get store_id from various locations
                      ...(product.store_id && { storeId: product.store_id }),
                      ...(storeInfo?.id && { storeId: storeInfo.id }),
                      ...(product.vendor_id && !product.store_id && !storeInfo?.id && { storeId: product.vendor_id }),
                    };

                    dispatch(addItem(payload));
                    // Show success message
                    setShowSuccessMessage(true);
                    setTimeout(() => setShowSuccessMessage(false), 3000);
                  } else {
                    // If not authenticated, still add to cart (cart works without auth)
                    const numericBase = Number(
                      product?.price_tax_excl || 
                      product?.price || 
                      product?.unit_price || 
                      product?.final_price || 
                      0
                    );
                    const numericFlash = product?.flash_price != null ? Number(product.flash_price) : null;
                    const chosenPrice = Number.isFinite(numericFlash) ? numericFlash : numericBase;

                    // Handle store - could be object, array, or null
                    let storeInfo = null;
                    if (product.store) {
                      if (Array.isArray(product.store) && product.store.length > 0) {
                        storeInfo = product.store[0]; // Take first store if array
                      } else if (typeof product.store === 'object' && !Array.isArray(product.store)) {
                        storeInfo = product.store; // It's already an object
                      }
                    }

                    // If store info is missing, try to find it in the stores list passed as prop
                    if (!storeInfo && stores && stores.length > 0) {
                      const productStoreId = product.store_id || product.vendor_id;
                      if (productStoreId) {
                        storeInfo = stores.find(s => s.id === productStoreId || s.store_id === productStoreId);
                      }
                    }

                    const payload = {
                      id: product.id,
                      product: product,
                      price: chosenPrice,
                      quantity: 1,
                      // Include store at top level if we have valid store info
                      ...(storeInfo && { store: storeInfo }),
                      // Also try to get store_id from various locations
                      ...(product.store_id && { storeId: product.store_id }),
                      ...(storeInfo?.id && { storeId: storeInfo.id }),
                      ...(product.vendor_id && !product.store_id && !storeInfo?.id && { storeId: product.vendor_id }),
                    };

                    dispatch(addItem(payload));
                    setShowSuccessMessage(true);
                    setTimeout(() => setShowSuccessMessage(false), 3000);
                  }
                }}
              >
                {t('product.addToCart')}
              </button>
            </div>
          </div>

          {/* Product details */}
          <div className="pt-3 px-2 cursor-pointer flex-grow flex flex-col justify-between" onClick={handleProductClick}>
            <ResponsiveText
              as="span"
              minSize="0.875rem"
              maxSize="0.95rem"
              className="font-medium text-oxford-blue block truncate pointer-events-none"
            >
              {product.name}
            </ResponsiveText>

            {/* Price row */}
            <div className="mt-1 flex items-center space-x-2 pointer-events-none">
              <span className="text-base font-bold text-jasper">
                {formatPrice(displayPrice)}
              </span>
              {hasStrike && (
                <span className="text-sm text-sonic-silver line-through">
                  {formatPrice(originalForCompare || basePrice)}
                </span>
              )}
            </div>

            {/* Flash Sale Countdown Timer */}
            {flashPrice && (product?.flash_sale_end_date || product?.pivot?.end_date) && (
              <div className="mt-2 pointer-events-none">
                <CountdownTimer
                  endDate={product?.flash_sale_end_date || product?.pivot?.end_date}
                  className="text-xs"
                />
              </div>
            )}

            {/* Rating */}
            <div className="mt-1 flex items-center pointer-events-none">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => {
                  const starValue = i + 1;
                  const isFilled = starValue <= Math.floor(effectiveRating);
                  const isHalfFilled = !isFilled && (starValue - 0.5) <= effectiveRating;
                  return (
                    <div key={i} className="relative w-4 h-4">
                      {/* Gray star background */}
                      <svg
                        className="w-4 h-4 absolute top-0 left-0 text-gray-300"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
                      </svg>
                      {/* Yellow fill */}
                      <div
                        className="absolute top-0 left-0 overflow-hidden"
                        style={{ width: isFilled ? "100%" : isHalfFilled ? "50%" : "0%" }}
                      >
                        <svg
                          className="w-4 h-4 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
              <span className="ml-1 text-xs text-gray-500">
                ({effectiveReviewCount})
              </span>
            </div>
          </div>
        </div>
      </motion.div>

    </>
  );
};

export default ProductCard;
