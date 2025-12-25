//src/components/ProductCard.jsx
"use client";

import { FaEye, FaHeart, FaRegEye, FaRegHeart } from "react-icons/fa";
import ResponsiveText from "./UI/ResponsiveText";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from '@/contexts/I18nContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import CountdownTimer from "./CountdownTimer";
import { productFavorites } from "@/utils/favoritesApi";

const ProductCard = ({ product, index, isFavorite, toggleFavorite, onPreviewClick, TotalProducts, productModal }) => {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const totalProducts = TotalProducts || 4;

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
  const basePrice = Number(product?.price_tax_excl || 0);
  const flashPrice = product?.flash_price != null ? Number(product.flash_price) : null;
  const comparePrice = Number(product?.compared_price || 0);

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
        }} className="flex-shrink-0 w-[86vw] sm:w-[270px] rounded-xl">
        <div className="bg-white rounded-xl px-1 sm:px-0">
          {/* Image + Actions */}
          <div
            className="relative grid items-end bg-cultured h-[250px] group rounded-xl overflow-hidden cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={handleProductClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleProductClick(); } }}
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
                    } catch {}
                    
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
            <div className="flex flex-col items-center">
              <div className="w-[170px] h-40 flex items-center justify-center">
                <img
                  src={
                    product?.featured_image?.url
                      ? `${process.env.NEXT_PUBLIC_API_URL}/${product.featured_image.url}`
                      : '/images/NoImageLong.jpg'
                  }
                  alt={product.name}
                  className="max-h-full object-contain"
                />
              </div>

              {/* Add to Cart (on hover) */}
              <button
                className="mt-3 cursor-pointer text-sm w-full font-semibold bg-vivid-red text-white py-2 
            rounded-b-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300"
                onClick={(e) => { e.stopPropagation(); handleProductClick(); }}
              >
                {t('product.addToCart')}
              </button>
            </div>
          </div>

          {/* Product details */}
          <div className="pt-3 px-2">
            <ResponsiveText
              as="span"
              minSize="0.875rem"
              maxSize="0.95rem"
              className="font-medium text-oxford-blue block truncate"
            >
              {product.name}
            </ResponsiveText>

            {/* Price row */}
            <div className="mt-1 flex items-center space-x-2">
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
              <div className="mt-2">
                <CountdownTimer 
                  endDate={product?.flash_sale_end_date || product?.pivot?.end_date} 
                  className="text-xs"
                />
              </div>
            )}

            {/* Rating */}
            <div className="mt-1 flex items-center">
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
