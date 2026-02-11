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

  initial={{ opacity: 0, y: 30 }}

  animate={{ opacity: 1, y: 0 }}

  exit={{ opacity: 0, y: 30 }}

  transition={{ duration: 0.3, delay: index * 0.1 }}

  whileHover={{ y: -4 }}

  className="flex-shrink-0 w-full max-w-[270px] h-[300px]"

>

  <div

    className="bg-white rounded-[4px] overflow-hidden  flex flex-col group h-full gap-4 cursor-pointer"

    onClick={handleProductClick}

    role="button"

    tabIndex={0}

  >

    {/* ================= IMAGE SECTION ================= */}

    <div className="relative bg-[#f5f5f5] h-[170px] flex items-center justify-center group">



      {/* Discount badge */}

      {typeof discount === "number" && discount > 0 && (

        <span className="absolute top-3 left-3 bg-[#ef4444] text-white text-xs font-semibold px-2 py-[2px] rounded">

          -{discount}%

        </span>

      )}



      {/* Favorite + Preview */}

      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">

        <span

          onClick={async (e) => {

            e.stopPropagation();

            if (!product?.id) return;



            const wasFavorite = isFavorite;

            toggleFavorite(index);



            try {

              if (wasFavorite) {

                await productFavorites.remove(product.id);

              } else {

                await productFavorites.add(product.id);

              }

            } catch {

              toggleFavorite(index);

            }

          }}

          className={`w-8 h-8 rounded-full bg-white shadow flex items-center justify-center border transition

            ${isFavorite ? "border-vivid-red" : "border-gray-200"}`}

        >

          {isFavorite ? (

            <FaHeart className="text-vivid-red text-sm" />

          ) : (

            <FaRegHeart className="text-gray-700 text-sm" />

          )}

        </span>



        <span className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center border border-gray-200">

          <FaEye className="text-gray-700 text-sm" />

        </span>

      </div>



      {/* Product image */}

      <img

        src={(() => {

          const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

          let imageUrl = null;



          if (product?.featured_image?.url) imageUrl = product.featured_image.url;

          else if (product?.base_image?.url) imageUrl = product.base_image.url;

          else if (Array.isArray(product?.images) && product.images.length)

            imageUrl = product.images[0]?.url;

          else if (product?.image) imageUrl = product.image;



          if (!imageUrl) return "/images/NoImageLong.jpg";

          if (imageUrl.startsWith("http")) return imageUrl;



          return `${apiBase}/${imageUrl.replace(/^\//, "")}`;

        })()}

        alt={product.name || "Product"}

        className="absolute w-[140px] h-[146px] object-contain opacity-100"

        onError={(e) => (e.target.src = "/images/NoImageLong.jpg")}

      />



      {/* Add to Cart Button - shows on hover over image */}

      <button

        onClick={(e) => {

          e.stopPropagation();



          const numericBase = Number(

            product?.price_tax_excl ||

            product?.price ||

            product?.unit_price ||

            product?.final_price ||

            0

          );



          const numericFlash =

            product?.flash_price != null ? Number(product.flash_price) : null;



          const chosenPrice = Number.isFinite(numericFlash)

            ? numericFlash

            : numericBase;



          dispatch(

            addItem({

              id: product.id,

              product,

              price: chosenPrice,

              quantity: 1,

            })

          );



          setShowSuccessMessage(true);

          setTimeout(() => setShowSuccessMessage(false), 3000);

        }}

        className="absolute bottom-0 left-0 right-0 w-full bg-[#ff4d2d] text-white text-xs font-semibold py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"

      >

        {t("product.addToCart")}

      </button>

    </div>



    {/* ================= DETAILS ================= */}

    <div className="p-3 flex flex-col gap-2">

      {/* Product Name */}

      <span className="text-base font-medium text-gray-900 truncate">

        {product.name}

      </span>



      {/* Price */}

      <div className="flex items-center gap-2">

        <span className="text-[#ff4d2d] font-bold">

          {formatPrice(displayPrice)}

        </span>

        {hasStrike && (

          <span className="text-gray-400 text-sm line-through">

            {formatPrice(originalForCompare || basePrice)}

          </span>

        )}

      </div>



      {/* Rating */}

      <div className="flex items-center gap-1">

        <div className="flex" style={{ color: '#FFAD33' }}>

          {[...Array(5)].map((_, i) => (

            <span key={i} style={{ fontSize: '20px', width: '20px', height: '20px', display: 'inline-block', lineHeight: '20px' }}>★</span>

          ))}

        </div>

        <span className="text-xs text-gray-500">

          ({effectiveReviewCount})

        </span>

      </div>

    </div>

  </div>

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

  whileHover={{ y: -4 }}

  className="flex-shrink-0 w-full max-w-[270px] h-[300px]"

>

  <div

    className="bg-white rounded-[4px] overflow-hidden  flex flex-col group h-full gap-4 cursor-pointer"

    onClick={handleProductClick}

    role="button"

    tabIndex={0}

  >

    {/* ================= IMAGE SECTION ================= */}

    <div className="relative bg-[#f5f5f5] h-[170px] flex items-center justify-center group">



      {/* Discount badge */}

      {typeof discount === "number" && discount > 0 && (

        <span className="absolute top-3 left-3 bg-[#ef4444] text-white text-xs font-semibold px-2 py-[2px] rounded">

          -{discount}%

        </span>

      )}



      {/* Favorite + Preview */}

      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">

        <span

          onClick={async (e) => {

            e.stopPropagation();

            if (!product?.id) return;



            const wasFavorite = isFavorite;

            toggleFavorite(index);



            try {

              if (wasFavorite) {

                await productFavorites.remove(product.id);

              } else {

                await productFavorites.add(product.id);

              }

            } catch {

              toggleFavorite(index);

            }

          }}

          className={`w-8 h-8 rounded-full bg-white shadow flex items-center justify-center border transition

            ${isFavorite ? "border-vivid-red" : "border-gray-200"}`}

        >

          {isFavorite ? (

            <FaHeart className="text-vivid-red text-sm" />

          ) : (

            <FaRegHeart className="text-gray-700 text-sm" />

          )}

        </span>



        <span className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center border border-gray-200">

          <FaEye className="text-gray-700 text-sm" />

        </span>

      </div>



      {/* Product image */}

      <img

        src={(() => {

          const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

          let imageUrl = null;



          if (product?.featured_image?.url) imageUrl = product.featured_image.url;

          else if (product?.base_image?.url) imageUrl = product.base_image.url;

          else if (Array.isArray(product?.images) && product.images.length)

            imageUrl = product.images[0]?.url;

          else if (product?.image) imageUrl = product.image;



          if (!imageUrl) return "/images/NoImageLong.jpg";

          if (imageUrl.startsWith("http")) return imageUrl;



          return `${apiBase}/${imageUrl.replace(/^\//, "")}`;

        })()}

        alt={product.name || "Product"}

        className="absolute w-[140px] h-[146px] object-contain opacity-100"

        onError={(e) => (e.target.src = "/images/NoImageLong.jpg")}

      />



      {/* Add to Cart Button - shows on hover over image */}

      <button

        onClick={(e) => {

          e.stopPropagation();



          const numericBase = Number(

            product?.price_tax_excl ||

            product?.price ||

            product?.unit_price ||

            product?.final_price ||

            0

          );



          const numericFlash =

            product?.flash_price != null ? Number(product.flash_price) : null;



          const chosenPrice = Number.isFinite(numericFlash)

            ? numericFlash

            : numericBase;



          dispatch(

            addItem({

              id: product.id,

              product,

              price: chosenPrice,

              quantity: 1,

            })

          );



          setShowSuccessMessage(true);

          setTimeout(() => setShowSuccessMessage(false), 3000);

        }}

        className="absolute bottom-0 left-0 right-0 w-full bg-[#ff4d2d] text-white text-xs font-semibold py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"

      >

        {t("product.addToCart")}

      </button>

    </div>



    {/* ================= DETAILS ================= */}

    <div className="p-3 flex flex-col gap-2">

      {/* Product Name */}

      <span className="text-base font-medium text-gray-900 truncate">

        {product.name}

      </span>



      {/* Price */}

      <div className="flex items-center gap-2">

        <span className="text-[#ff4d2d] font-bold">

          {formatPrice(displayPrice)}

        </span>

        {hasStrike && (

          <span className="text-gray-400 text-sm line-through">

            {formatPrice(originalForCompare || basePrice)}

          </span>

        )}

      </div>



      {/* Rating */}

      <div className="flex items-center gap-1">

        <div className="flex" style={{ color: '#FFAD33' }}>

          {[...Array(5)].map((_, i) => (

            <span key={i} style={{ fontSize: '20px', width: '20px', height: '20px', display: 'inline-block', lineHeight: '20px' }}>★</span>

          ))}

        </div>

        <span className="text-xs text-gray-500">

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

