// src/app/product/[id]/page.jsx
'use client';

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import IconButton from "@/components/UI/IconButton";
import { ShareIcon, HeartIcon, CheckIcon, TruckIcon, ShieldCheckIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { FaRecycle, FaRepeat, FaTruckFast } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { addItem } from "../../../store/slices/cartSlice";
import ResponsiveText from "@/components/UI/ResponsiveText";
import { useGetRequest } from "@/controller/getRequests";
import ReviewSlider from "@/components/ReviewSlider";
import { useI18n } from '@/contexts/I18nContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import BackButton from "@/components/UI/BackButton";
import SharedLayout from "@/components/SharedLayout";
import { useSelector } from "react-redux";

export default function ProductDetailPage() {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;
  const deliveryMode = useSelector((state) => state.delivery.mode);

  // Redirect if productId is a route name (like "sign-up", "login", etc.)
  useEffect(() => {
    const invalidIds = ['sign-up', 'login', 'signup', 'signin', 'sign-in'];
    if (productId && invalidIds.includes(productId.toLowerCase())) {
      router.replace(`/${productId}`);
    }
  }, [productId, router]);

  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [colorsArray, setColorsArray] = useState([]);
  const [sizeArray, setSizeArray] = useState([]);
  const [batteryLife, setBatteryLife] = useState(0);
  const [storage, setStorage] = useState('');
  const [ram, setRam] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);
  const [reviews, setReviews] = useState([]);

  const {
    data: productsData,
    error: productsError,
    loading: productsLoading,
    sendGetRequest: getProducts,
  } = useGetRequest();

  // Dedicated single-product fetch (direct /products/{id} API)
  const {
    data: singleProductData,
    error: singleProductError,
    loading: singleProductLoading,
    sendGetRequest: getSingleProduct,
  } = useGetRequest();

  const {
    data: ratingData,
    error: ratingError,
    loading: ratingLoading,
    sendGetRequest: getRating,
  } = useGetRequest();

  const {
    data: vendorData,
    error: vendorError,
    loading: vendorLoading,
    sendGetRequest: getVendorRating,
  } = useGetRequest();

  const {
    data: storeData,
    error: storeError,
    loading: storeLoading,
    sendGetRequest: getStoreData,
  } = useGetRequest();

  const {
    data: flashData,
    error: flashError,
    loading: flashLoading,
    sendGetRequest: getFlash,
  } = useGetRequest();

  const dispatch = useDispatch();

  // Refs to track what we've already fetched to prevent infinite loops
  const fetchedRatingRef = useRef(null);
  const fetchedVendorRatingRef = useRef(null);
  const fetchedStoreDataRef = useRef(null);

  // Prefer single-product API, fall back to products list
  const singleProduct = useMemo(() => {
    return singleProductData?.data || singleProductData || null;
  }, [singleProductData]);

  const allProducts = useMemo(() => {
    return productsData?.data?.data || productsData?.data || [];
  }, [productsData]);

  const flashProducts = useMemo(() => {
    return (flashData?.data?.products || []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  }, [flashData?.data?.products]);

  const listProduct = useMemo(() => {
    return allProducts.find(
      (p) => String(p?.id) === String(productId)
    );
  }, [allProducts, productId]);

  // Base product: use single-product response first, then list fallback
  const baseProduct = useMemo(() => {
    return singleProduct || listProduct || null;
  }, [singleProduct, listProduct]);

  const productWithFlash = useMemo(() => {
    if (baseProduct && flashProducts[baseProduct.id]) {
      return { ...baseProduct, flash_price: flashProducts[baseProduct.id].flash_price };
    }
    return baseProduct;
  }, [baseProduct, flashProducts]);

  useEffect(() => {
    if (productId) {
      // Reset refs when productId changes to allow fetching new product data
      fetchedRatingRef.current = null;
      fetchedVendorRatingRef.current = null;
      fetchedStoreDataRef.current = null;
      
      // Fetch single product by ID (public API endpoint)
      getSingleProduct(`/products/${productId}`);

      // Fetch products list to find the product
      const modeParam = `mode=${deliveryMode}`;
      const lat = localStorage.getItem('lat');
      const lng = localStorage.getItem('lng');
      
      let url = '';
      if (lat && lng) {
        url = `/products/getNearbyProducts?lat=${lat}&lng=${lng}&${modeParam}`;
      } else {
        url = `/products/getAllProducts?${modeParam}`;
      }
      
      getProducts(url);
      getFlash('/flash-sales/active');
    }
  }, [productId, deliveryMode, getProducts, getFlash, getSingleProduct]);

  useEffect(() => {
    const productIdValue = productWithFlash?.id;
    if (productIdValue && fetchedRatingRef.current !== productIdValue) {
      fetchedRatingRef.current = productIdValue;
      getRating(`/products/${productIdValue}/rating`);
    }
    
    // For store-based vendors
    const storeId = productWithFlash?.store?.id || productWithFlash?.store?.slug || productWithFlash?.store_id;
    if (storeId && fetchedVendorRatingRef.current !== storeId) {
      fetchedVendorRatingRef.current = storeId;
      getVendorRating(`/stores/${storeId}/rating`);
    }
    
    // Fetch store data to get user_id if not already available
    if (storeId && !productWithFlash?.store?.user_id && fetchedStoreDataRef.current !== storeId) {
      fetchedStoreDataRef.current = storeId;
      getStoreData(`/stores/${storeId}`);
    }
  }, [productWithFlash?.id, productWithFlash?.store?.id, productWithFlash?.store?.slug, productWithFlash?.store_id, getRating, getVendorRating, getStoreData]);

  useEffect(() => {
    if (productWithFlash?.product_attributes?.length) {
      const colorValues = productWithFlash.product_attributes
        .filter(item => item.variant_id == null && item.attribute_name === 'Color')
        .map(item => {
          if (Array.isArray(item.attribute_value)) {
            return item.attribute_value.map(v => v.toLowerCase());
          }
          return item.attribute_value?.toLowerCase();
        });

      // Battery Life (single number)
      const batteryLifeValue = productWithFlash.product_attributes.find(
        item => item.variant_id == null && item.attribute_name === 'Battery Life'
      );
      setBatteryLife(Number(batteryLifeValue?.attribute_value) || 0);

      // Storage
      const storageValue = productWithFlash.product_attributes
        .filter(item => item.variant_id == null && item.attribute_name === 'Storage')
        .map(item => item.attribute_value);

      // RAM
      const ramValue = productWithFlash.product_attributes
        .filter(item => item.variant_id == null && item.attribute_name === 'RAM')
        .map(item => item.attribute_value);

      const sizeValues = productWithFlash.product_attributes
        .filter(item => item.variant_id == null && item.attribute_name === 'Size')
        .map(item => item.attribute_value);

      setColorsArray(colorValues.flat().filter(Boolean));
      setSizeArray(sizeValues.flat().filter(Boolean));
      setStorage([...new Set(storageValue.filter(Boolean))]);
      setRam([...new Set(ramValue.filter(Boolean))]);
    }
  }, [productWithFlash]);

  useEffect(() => {
    if (colorsArray.length > 0 && !selectedColor) {
      setSelectedColor(colorsArray[0]);
    }
  }, [colorsArray, selectedColor]);

  // Track product view for recently viewed
  useEffect(() => {
    if (productWithFlash?.id) {
      try {
        const key = 'recentlyViewedProductIds';
        const dataKey = 'recentlyViewedProductsData';
        const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
        const rawData = typeof window !== 'undefined' ? localStorage.getItem(dataKey) : null;
        
        let ids = raw ? JSON.parse(raw) : [];
        let productsData = rawData ? JSON.parse(rawData) : [];
        
        if (!Array.isArray(ids)) ids = [];
        if (!Array.isArray(productsData)) productsData = [];
        
        const idStr = String(productWithFlash.id);
        
        // Remove existing entry
        ids = ids.filter((x) => String(x) !== idStr);
        productsData = productsData.filter((p) => String(p?.id) !== idStr);
        
        // Add to beginning
        ids.unshift(idStr);
        productsData.unshift(productWithFlash);
        
        // Keep only last 20
        ids = ids.slice(0, 20);
        productsData = productsData.slice(0, 20);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(ids));
          localStorage.setItem(dataKey, JSON.stringify(productsData));
          console.log('✅ Product viewed and saved to recently viewed:', productWithFlash.id, productWithFlash.name);
        }
      } catch (error) {
        console.error('Error saving recently viewed product:', error);
      }
    }
  }, [productWithFlash?.id]);

  const handleQuantityChange = (e) => {
    setQuantity(Math.max(1, parseInt(e.target.value) || 1));
  };

  const handleAddToCart = () => {
    if (!productWithFlash) return;
    
    const numericBase = Number(productWithFlash?.price_tax_excl || productWithFlash?.price || 0);
    const numericFlash = productWithFlash?.flash_price != null ? Number(productWithFlash.flash_price) : null;
    const chosenPrice = Number.isFinite(numericFlash) ? numericFlash : numericBase;

    const payload = {
      id: productWithFlash.id,
      product: productWithFlash,
      price: chosenPrice,
      quantity,
      ...(size ? { size } : {}),
      color: selectedColor,
      batteryLife,
      storage: storage[0],
      ram: ram[0]
    };

    console.log("Dispatching addItem with payload:", payload);
    dispatch(addItem(payload));
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    try {
      const key = String(productWithFlash?.id ?? productWithFlash?.name);
      const saved = JSON.parse(localStorage.getItem('favorites') || '{}');
      if (saved[key]) delete saved[key]; else saved[key] = true;
      localStorage.setItem('favorites', JSON.stringify(saved));
    } catch {}
  };

  const productImages = productWithFlash?.images && productWithFlash.images.length > 0 
    ? productWithFlash.images 
    : productWithFlash?.featured_image 
      ? [{ url: productWithFlash.featured_image.url, alt_text: productWithFlash.name }]
      : [];

  const mainImageUrl = productImages[selectedImageIndex]?.url 
    ? `${process.env.NEXT_PUBLIC_API_URL}/${productImages[selectedImageIndex].url}`
    : productWithFlash?.featured_image?.url
      ? `${process.env.NEXT_PUBLIC_API_URL}/${productWithFlash.featured_image.url}`
      : '/images/NoImageLong.jpg';

  if (productsLoading || flashLoading || singleProductLoading) {
    return (
      <SharedLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#F24E2E] mb-4"></div>
              <p className="text-gray-600">{t('common.loading')}...</p>
            </div>
          </div>
        </div>
      </SharedLayout>
    );
  }

  const combinedError = productsError || singleProductError;

  if (combinedError || !productWithFlash) {
    return (
      <SharedLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <BackButton />
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-4 text-center">
            <p className="text-red-600 font-medium">
              {t('common.error')}: {combinedError || 'Product not found'}
            </p>
          </div>
        </div>
      </SharedLayout>
    );
  }

  const discount = productWithFlash.compared_price && productWithFlash.compared_price > (productWithFlash.flash_price || productWithFlash.price_tax_excl)
    ? Math.round(((productWithFlash.compared_price - (productWithFlash.flash_price || productWithFlash.price_tax_excl)) / productWithFlash.compared_price) * 100)
    : 0;

  return (
    <SharedLayout>
      <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 sm:mb-6">
          <BackButton variant="gradient" showLabel={true} />
        </div>

          {/* Success Message */}
          <AnimatePresence>
            {showSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm sm:text-base"
              >
                <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Product added to cart successfully!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden"
          >
            {/* Header Actions */}
            <div className="flex justify-between items-center p-3 sm:p-4 lg:p-6 border-b border-gray-100">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {discount > 0 && (
                  <span className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-full">
                    -{discount}% OFF
                  </span>
                )}
                <span className="bg-green-100 text-green-700 text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1 rounded-full">
                  {t('common.inStock')}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={toggleFavorite}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors touch-manipulation"
                >
                  {isFavorite ? (
                    <HeartSolidIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  )}
                </button>
                <IconButton icon={ShareIcon} className="!min-w-7 !min-h-7 sm:!min-w-8 sm:!min-h-8" iconClasses="!w-3.5 !h-3.5 sm:!w-4 sm:!h-4 !text-gray-600" />
              </div>
            </div>

            {/* Product Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 p-3 sm:p-4 lg:p-8">
              {/* Image Gallery */}
              <div className="space-y-3 sm:space-y-4">
                {/* Main Image */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 w-full aspect-square sm:aspect-[4/3] lg:aspect-[3/4] flex items-center justify-center group cursor-zoom-in overflow-hidden"
                  onMouseEnter={() => setImageZoom(true)}
                  onMouseLeave={() => setImageZoom(false)}
                >
                  <motion.img
                    src={mainImageUrl}
                    alt={productWithFlash.name}
                    className={`max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-300 ${
                      imageZoom ? 'scale-110' : 'scale-100'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  />
                </motion.div>

                {/* Thumbnail Gallery */}
                {productImages.length > 1 && (
                  <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {productImages.map((image, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all touch-manipulation ${
                          selectedImageIndex === index
                            ? 'border-[#F24E2E] ring-2 ring-[#F24E2E]/30'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={
                            image?.url
                              ? `${process.env.NEXT_PUBLIC_API_URL}/${image.url}`
                              : '/images/NoImageLong.jpg'
                          }
                          alt={image.alt_text || productWithFlash.name}
                          className="w-full h-full object-cover"
                        />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-4 sm:space-y-6">
                {/* Title & Rating */}
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                    {productWithFlash.name}
                  </h1>
                  {((ratingData?.data?.average_rating && ratingData.data.average_rating > 0) || (ratingData?.data?.review_count && ratingData.data.review_count > 0)) && (
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                      {(ratingData?.data?.average_rating && ratingData.data.average_rating > 0) && (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => {
                              const starValue = i + 1;
                              const avgRating = ratingData.data.average_rating;
                              const isFilled = starValue <= Math.floor(avgRating);
                              const isHalfFilled = !isFilled && (starValue - 0.5) <= avgRating;
                              return (
                                <div key={i} className="relative w-4 h-4 sm:w-5 sm:h-5">
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5 absolute top-0 left-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
                                  </svg>
                                  <div className="absolute top-0 left-0 overflow-hidden" style={{ width: isFilled ? '100%' : isHalfFilled ? '50%' : '0%' }}>
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
                                    </svg>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-gray-700">
                            {ratingData.data.average_rating.toFixed(1)}
                            {(ratingData?.data?.review_count && ratingData.data.review_count > 0) && (
                              <> ({ratingData.data.review_count} {t('common.reviews')})</>
                            )}
                          </span>
                        </div>
                      )}
                      {(!ratingData?.data?.average_rating || ratingData.data.average_rating === 0) && (ratingData?.data?.review_count && ratingData.data.review_count > 0) && (
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          ({ratingData.data.review_count} {t('common.reviews')})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-red-100">
                  <div className="flex items-baseline gap-2 sm:gap-4 flex-wrap">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F24E2E]">
                      {formatPrice(productWithFlash.flash_price != null ? productWithFlash.flash_price : productWithFlash.price_tax_excl)}
                    </span>
                    {productWithFlash.compared_price && productWithFlash.compared_price > (productWithFlash.flash_price || productWithFlash.price_tax_excl) && (
                      <div className="flex flex-col">
                        <span className="text-base sm:text-lg text-gray-400 line-through">
                          {formatPrice(productWithFlash.compared_price)}
                        </span>
                        <span className="text-xs sm:text-sm text-green-600 font-semibold">
                          Save {formatPrice(productWithFlash.compared_price - (productWithFlash.flash_price || productWithFlash.price_tax_excl))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {productWithFlash.description && (
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {productWithFlash.description}
                    </p>
                  </div>
                )}

                {/* Variants */}
                <div className="space-y-3 sm:space-y-4">
                  {colorsArray.length > 0 && (
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Select Color</label>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {colorsArray.map((color) => (
                          <motion.button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className={`
                              w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 cursor-pointer transition-all shadow-sm touch-manipulation
                              ${selectedColor === color ? "border-[#F24E2E] ring-2 sm:ring-4 ring-[#F24E2E]/20 scale-110" : "border-gray-300 hover:border-gray-400"}
                            `}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {sizeArray.length > 0 && (
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Select Size</label>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {sizeArray.map((s) => (
                          <motion.button
                            key={s}
                            onClick={() => setSize(s)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`
                              px-3 sm:px-5 py-2 sm:py-2.5 border-2 rounded-lg sm:rounded-xl cursor-pointer min-w-[50px] sm:min-w-[60px] text-xs sm:text-sm font-medium transition-all touch-manipulation
                              ${size === s 
                                ? "bg-[#F24E2E] text-white border-[#F24E2E] shadow-lg" 
                                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                              }
                            `}
                          >
                            {s}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(() => {
                    // Filter out empty values, "0", 0, and null
                    const validStorage = Array.isArray(storage) 
                      ? storage.filter(s => s && s !== '0' && s !== 0 && String(s).trim() !== '')
                      : (storage && storage !== '0' && storage !== 0 && String(storage).trim() !== '' ? [storage] : []);
                    
                    const validRam = Array.isArray(ram)
                      ? ram.filter(r => r && r !== '0' && r !== 0 && String(r).trim() !== '')
                      : (ram && ram !== '0' && ram !== 0 && String(ram).trim() !== '' ? [ram] : []);
                    
                    const hasStorage = validStorage.length > 0;
                    const hasRam = validRam.length > 0;
                    const hasBattery = batteryLife && batteryLife > 0;
                    
                    if (!hasStorage && !hasRam && !hasBattery) {
                      return null;
                    }
                    
                    // Double check we have at least one valid item to display
                    const itemsToShow = [];
                    if (hasStorage && validStorage[0]) itemsToShow.push('storage');
                    if (hasRam && validRam[0]) itemsToShow.push('ram');
                    if (hasBattery) itemsToShow.push('battery');
                    
                    if (itemsToShow.length === 0) {
                      return null;
                    }
                    
                    return (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">Specifications</label>
                        <div className="text-xs sm:text-sm text-gray-700 flex flex-wrap gap-1 sm:gap-2">
                          {hasStorage && validStorage[0] && String(validStorage[0]).trim() !== '' && String(validStorage[0]) !== '0' && (
                            <>
                              <span><span className="font-medium">Storage:</span> {validStorage[0]}</span>
                              {((hasRam && validRam[0] && String(validRam[0]).trim() !== '' && String(validRam[0]) !== '0') || hasBattery) && <span className="hidden sm:inline">|</span>}
                            </>
                          )}
                          {hasRam && validRam[0] && String(validRam[0]).trim() !== '' && String(validRam[0]) !== '0' && (
                            <>
                              <span><span className="font-medium"> RAM:</span> {validRam[0]}</span>
                              {hasBattery && <span className="hidden sm:inline">|</span>}
                            </>
                          )}
                          {hasBattery && batteryLife > 0 && (
                            <span><span className="font-medium"> Battery:</span> {batteryLife} Hr.</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quantity & Add to Cart */}
                  <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                      <label className="text-xs sm:text-sm font-semibold text-gray-900">Quantity:</label>
                      <div className="flex items-center border-2 border-gray-300 rounded-lg sm:rounded-xl overflow-hidden bg-white">
                        <motion.button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          whileHover={{ backgroundColor: '#f3f4f6' }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 sm:px-4 py-2 sm:py-3 text-lg sm:text-xl font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors touch-manipulation"
                        >
                          −
                        </motion.button>
                        <input
                          type="number"
                          value={quantity}
                          onChange={handleQuantityChange}
                          className="w-12 sm:w-16 h-full text-center border-x-2 border-gray-300 appearance-none text-base sm:text-lg font-semibold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:outline-none"
                        />
                        <motion.button
                          onClick={() => setQuantity(quantity + 1)}
                          whileHover={{ backgroundColor: '#f3f4f6' }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 sm:px-4 py-2 sm:py-3 text-lg sm:text-xl font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors touch-manipulation"
                        >
                          +
                        </motion.button>
                      </div>
                    </div>
                    <motion.button
                      onClick={handleAddToCart}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-[#F24E2E] to-orange-500 hover:from-[#e03e1e] hover:to-orange-600 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all text-base sm:text-lg flex items-center justify-center gap-2 touch-manipulation"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {t('product.addToCart')}
                    </motion.button>
                  </div>
                </div>

                {/* Seller & Shipping Info */}
                <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
                  <div className="flex gap-3 sm:gap-4 items-start">
                    <div className="bg-[#F24E2E]/10 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
                      <FaTruckFast className="text-xl sm:text-2xl text-[#F24E2E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">
                        {productWithFlash?.store?.name || productWithFlash?.seller?.name || 'Seller'}
                      </h3>
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          {Number(vendorData?.data?.bayesian_rating ?? productWithFlash?.store?.rating ?? productWithFlash?.seller?.rating ?? 0).toFixed(2)}/5
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">{t('checkout.enterPostalCode')}</p>
                      <motion.button
                        onClick={async () => {
                          if (!productWithFlash) {
                            console.error('Product is not available');
                            return;
                          }
                          
                          let vendorUserId = productWithFlash?.user_id || productWithFlash?.seller_id || productWithFlash?.seller?.id || productWithFlash?.seller?.user_id;
                          
                          if (!vendorUserId) {
                            const storeId = productWithFlash?.store?.id || productWithFlash?.store?.slug || productWithFlash?.store_id;
                            vendorUserId = productWithFlash?.store?.user_id || storeData?.data?.user_id;
                            
                            if (!vendorUserId && storeId) {
                              try {
                                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/stores/${storeId}`);
                                const data = await response.json();
                                vendorUserId = data?.data?.user_id;
                              } catch (error) {
                                console.error('Error fetching store user_id:', error);
                              }
                            }
                          }
                          
                          if (vendorUserId) {
                            const event = new CustomEvent('openVendorChat', {
                              detail: { vendorId: vendorUserId }
                            });
                            window.dispatchEvent(event);
                          } else {
                            console.warn('Could not find vendor/seller user_id for product:', productWithFlash?.id);
                            alert('Unable to find seller information. Please try again later.');
                          }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl transition-colors flex items-center justify-center gap-2 font-medium touch-manipulation"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="truncate">{t('product.contactVendor') || 'Contact Vendor'}</span>
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4 sm:pt-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="flex gap-2 sm:gap-3 items-start">
                        <div className="bg-green-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                          <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-900">Free Returns</h4>
                          <p className="text-[10px] sm:text-xs text-gray-600">30 Days Return Policy</p>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:gap-3 items-start">
                        <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                          <ShieldCheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-900">Secure Payment</h4>
                          <p className="text-[10px] sm:text-xs text-gray-600">100% Secure Checkout</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Reviews Section */}
          <div className="mt-4 sm:mt-6 lg:mt-8">
            <ReviewSlider productId={productWithFlash.id} />
          </div>
        </div>
      </div>
    </SharedLayout>
  );
}

