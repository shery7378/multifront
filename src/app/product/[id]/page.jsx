// src/app/product/[id]/page.jsx
'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
import { usePostRequest } from "@/controller/postRequests";
import ReviewSlider from "@/components/ReviewSlider";
import { useI18n } from '@/contexts/I18nContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import BackButton from "@/components/UI/BackButton";
import SharedLayout from "@/components/SharedLayout";
import { useSelector } from "react-redux";
import { productFavorites } from "@/utils/favoritesApi";
import ProductDetailSection from "./ProductDetailSection";
import TestimonialSection from "@/components/new-design/TestimonialSection";

export default function ProductDetailPage() {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;
  const deliveryMode = useSelector((state) => state.delivery.mode);
  const { token } = useSelector((state) => state.auth);

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
  const [postalCode, setPostalCode] = useState('');
  const [deliveryAvailable, setDeliveryAvailable] = useState(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  // Daraz-style variant selection state
  const [selectedAttributes, setSelectedAttributes] = useState({}); // { Color: 'red', Storage: '256GB', etc. }

  // Handle attribute selection
  const handleAttributeSelect = useCallback((attrName, attrValue) => {
    setSelectedAttributes(prev => {
      const newAttrs = { ...prev };
      // If clicking the same value, deselect it
      if (newAttrs[attrName] === attrValue) {
        delete newAttrs[attrName];
      } else {
        newAttrs[attrName] = attrValue;
      }
      return newAttrs;
    });
  }, []);

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

  const { sendPostRequest: logView } = usePostRequest();

  const dispatch = useDispatch();

  // Refs to track what we've already fetched to prevent infinite loops
  const fetchedRatingRef = useRef(null);
  const fetchedVendorRatingRef = useRef(null);
  const fetchedStoreDataRef = useRef(null);

  // Prefer single-product API, fall back to products list
  const singleProduct = useMemo(() => {
    const product = singleProductData?.data || singleProductData || null;
    // Log when product data changes to debug refresh
    if (product && typeof window !== 'undefined') {
      console.log('📦 [ProductDetail] Single product data updated:', {
        id: product.id,
        name: product.name,
        variants: product.product_variants?.length || 0,
        variantQuantities: product.product_variants?.map(v => ({
          id: v.id,
          qty: v.qty ?? v.quantity ?? 0
        })) || []
      });
    }
    return product;
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

  // Extract store info for easier access
  const storeInfo = useMemo(() => {
    if (!productWithFlash?.store) return null;
    if (Array.isArray(productWithFlash.store)) return productWithFlash.store[0];
    return productWithFlash.store;
  }, [productWithFlash]);

  // Get current display variant (selected variant or base product)
  const displayVariant = useMemo(() => {
    return selectedVariant || productWithFlash;
  }, [selectedVariant, productWithFlash]);

  // Get current quantity (from variant or product)
  const currentQuantity = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant?.quantity ?? selectedVariant?.qty ?? 0;
    }
    return productWithFlash?.quantity ?? productWithFlash?.qty ?? 0;
  }, [selectedVariant, productWithFlash]);

  // Get current price (from variant or product)
  const currentPrice = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant?.price_tax_excl || selectedVariant?.price || 0;
    }
    return productWithFlash?.flash_price || productWithFlash?.price_tax_excl || productWithFlash?.price || 0;
  }, [selectedVariant, productWithFlash]);

  // Reset quantity when variant changes or if quantity exceeds available stock
  useEffect(() => {
    if (currentQuantity > 0 && quantity > currentQuantity) {
      setQuantity(Math.min(quantity, currentQuantity));
    } else if (currentQuantity === 0) {
      setQuantity(1); // Keep at 1 but disable add to cart
    }
  }, [currentQuantity, quantity]);

  // Helper function to extract unique attribute values from variants
  const getVariantAttributes = useMemo(() => {
    if (!productWithFlash?.product_variants || !Array.isArray(productWithFlash.product_variants)) {
      return {};
    }

    const attributes = {};

    productWithFlash.product_variants.forEach(variant => {
      // Get attributes from variant.attributes
      if (variant?.attributes && Array.isArray(variant.attributes)) {
        variant.attributes.forEach(attr => {
          if (attr.attribute_name && attr.attribute_value) {
            const attrName = attr.attribute_name;
            if (!attributes[attrName]) {
              attributes[attrName] = new Set();
            }
            const value = Array.isArray(attr.attribute_value)
              ? attr.attribute_value.join(', ')
              : String(attr.attribute_value);
            attributes[attrName].add(value);
          }
        });
      }

      // Get attributes from product_attributes for this variant
      if (productWithFlash?.product_attributes && Array.isArray(productWithFlash.product_attributes)) {
        productWithFlash.product_attributes
          .filter(attr => attr.variant_id === variant.id)
          .forEach(attr => {
            if (attr.attribute_name && attr.attribute_value) {
              const attrName = attr.attribute_name;
              if (!attributes[attrName]) {
                attributes[attrName] = new Set();
              }
              const value = Array.isArray(attr.attribute_value)
                ? attr.attribute_value.join(', ')
                : String(attr.attribute_value);
              attributes[attrName].add(value);
            }
          });
      }
    });

    // Convert Sets to Arrays and sort
    const result = {};
    Object.keys(attributes).forEach(key => {
      result[key] = Array.from(attributes[key]).sort();
    });

    return result;
  }, [productWithFlash]);

  // Find matching variant based on selected attributes
  const findMatchingVariant = useCallback((attributes) => {
    if (!productWithFlash?.product_variants || !Array.isArray(productWithFlash.product_variants)) {
      return null;
    }

    // If no attributes selected, return null
    if (Object.keys(attributes).length === 0) {
      return null;
    }

    // Find variant that matches all selected attributes
    return productWithFlash.product_variants.find(variant => {
      const variantAttrs = {};

      // Collect variant attributes
      if (variant?.attributes && Array.isArray(variant.attributes)) {
        variant.attributes.forEach(attr => {
          if (attr.attribute_name && attr.attribute_value) {
            const value = Array.isArray(attr.attribute_value)
              ? attr.attribute_value.join(', ')
              : String(attr.attribute_value);
            variantAttrs[attr.attribute_name] = value;
          }
        });
      }

      // Also check product_attributes for this variant
      if (productWithFlash?.product_attributes && Array.isArray(productWithFlash.product_attributes)) {
        productWithFlash.product_attributes
          .filter(attr => attr.variant_id === variant.id)
          .forEach(attr => {
            if (attr.attribute_name && attr.attribute_value) {
              const value = Array.isArray(attr.attribute_value)
                ? attr.attribute_value.join(', ')
                : String(attr.attribute_value);
              variantAttrs[attr.attribute_name] = value;
            }
          });
      }

      // Check if all selected attributes match
      return Object.keys(attributes).every(attrName => {
        const selectedValue = String(attributes[attrName]).toLowerCase();
        const variantValue = String(variantAttrs[attrName] || '').toLowerCase();
        return variantValue === selectedValue || variantValue.includes(selectedValue) || selectedValue.includes(variantValue);
      });
    }) || null;
  }, [productWithFlash]);

  // Update selected variant when attributes change or product loads
  useEffect(() => {
    const matchingVariant = findMatchingVariant(selectedAttributes);

    // If no attributes are selected, auto-select first variant with stock available
    if (!matchingVariant && Object.keys(selectedAttributes).length === 0) {
      if (productWithFlash?.product_variants && Array.isArray(productWithFlash.product_variants) && productWithFlash.product_variants.length > 0) {
        // Find first variant with stock available (quantity > 0 or in_stock === true)
        const variantWithStock = productWithFlash.product_variants.find(v => {
          const qty = v?.quantity ?? v?.qty ?? 0;
          return qty > 0 || v?.in_stock === true;
        });

        // If no variant with stock found, just use the first variant
        const variantToSelect = variantWithStock || productWithFlash.product_variants[0];
        setSelectedVariant(variantToSelect);
        console.log('Auto-selected variant:', variantToSelect.id, variantWithStock ? '(with stock)' : '(first available)');
        return;
      }
    }

    // Otherwise, use the matching variant (or null if no match found)
    setSelectedVariant(matchingVariant);
  }, [selectedAttributes, findMatchingVariant, productWithFlash?.product_variants]);

  // Function to refresh product data
  const refreshProductData = useCallback(() => {
    if (!productId) {
      console.log('⚠️ [ProductDetail] Cannot refresh: no productId');
      return;
    }

    console.log('🔄 [ProductDetail] Refreshing product data for product:', productId);

    // Reset refs to allow re-fetching
    fetchedRatingRef.current = null;
    fetchedVendorRatingRef.current = null;
    fetchedStoreDataRef.current = null;

    // Add cache-busting parameter to ensure fresh data
    const cacheBuster = `?_t=${Date.now()}`;

    // Fetch single product by ID (public API endpoint) - use background mode to avoid loading state
    console.log('🔄 [ProductDetail] Fetching single product:', `/products/${productId}${cacheBuster}`);
    getSingleProduct(`/products/${productId}${cacheBuster}`, false, { background: true });

    // Fetch products list to find the product
    const modeParam = `mode=${deliveryMode}`;
    const lat = localStorage.getItem('lat');
    const lng = localStorage.getItem('lng');

    let url = '';
    if (lat && lng) {
      url = `/products/getNearbyProducts?lat=${lat}&lng=${lng}&${modeParam}${cacheBuster}`;
    } else {
      url = `/products/getAllProducts?${modeParam}${cacheBuster}`;
    }

    console.log('🔄 [ProductDetail] Fetching products list:', url);
    getProducts(url, false, { background: true });
    getFlash(`/flash-sales/active${cacheBuster}`, false, { background: true });
  }, [productId, deliveryMode, getProducts, getFlash, getSingleProduct]);

  useEffect(() => {
    if (productId) {
      // Check if an order was recently placed for this product
      try {
        const lastOrderStr = localStorage.getItem('lastOrderPlaced');
        if (lastOrderStr) {
          const lastOrder = JSON.parse(lastOrderStr);
          const timeSinceOrder = Date.now() - lastOrder.timestamp;
          const productIdStr = String(productId);
          const productIdNum = parseInt(productIdStr);

          console.log('🔍 [ProductDetail] Checking for recent order:', {
            lastOrder,
            timeSinceOrder,
            productIdStr,
            productIdNum,
            productIds: lastOrder.productIds,
            includesProduct: lastOrder.productIds?.includes(productIdNum)
          });

          // If order was placed within last 30 seconds and includes this product
          if (timeSinceOrder < 30000 && lastOrder.productIds?.includes(productIdNum)) {
            console.log('✅ [ProductDetail] Recent order detected for this product, will refresh after initial load');
            // Clear the flag so it doesn't refresh on every visit
            localStorage.removeItem('lastOrderPlaced');
            // Refresh after a short delay to ensure backend has processed
            setTimeout(() => {
              console.log('⏰ [ProductDetail] Triggering refresh after delay');
              refreshProductData();
            }, 2000);
          } else {
            console.log('ℹ️ [ProductDetail] No recent order found or order not for this product');
          }
        } else {
          console.log('ℹ️ [ProductDetail] No lastOrderPlaced in localStorage');
        }
      } catch (e) {
        console.warn('❌ [ProductDetail] Error checking last order:', e);
      }

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
  }, [productId, deliveryMode, getProducts, getFlash, getSingleProduct, refreshProductData]);

  // Listen for order placement events to refresh product data
  useEffect(() => {
    const handleOrderPlaced = (event) => {
      console.log('🛒 [ProductDetail] Order placed event received, refreshing product data...', event.detail);
      // Refresh product data after a short delay to ensure backend has updated
      setTimeout(() => {
        refreshProductData();
      }, 1000);
    };

    // Listen for orderPlaced event
    if (typeof window !== 'undefined') {
      window.addEventListener('orderPlaced', handleOrderPlaced);

      return () => {
        window.removeEventListener('orderPlaced', handleOrderPlaced);
      };
    }
  }, [refreshProductData]);

  // Also refresh when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && productId) {
        console.log('👁️ [ProductDetail] Page visible, checking for refresh...');
        // Check if we should refresh based on localStorage
        try {
          const lastOrderStr = localStorage.getItem('lastOrderPlaced');
          if (lastOrderStr) {
            const lastOrder = JSON.parse(lastOrderStr);
            const timeSinceOrder = Date.now() - lastOrder.timestamp;
            const productIdNum = parseInt(String(productId));

            if (timeSinceOrder < 60000 && lastOrder.productIds?.includes(productIdNum)) {
              console.log('👁️ [ProductDetail] Recent order found, refreshing product data...');
              localStorage.removeItem('lastOrderPlaced');
              setTimeout(() => {
                refreshProductData();
              }, 500);
            }
          }
        } catch (e) {
          console.warn('Error checking order on visibility:', e);
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [productId, refreshProductData]);

  // Also refresh when component mounts if returning from order page
  useEffect(() => {
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      if (productId) {
        try {
          const lastOrderStr = localStorage.getItem('lastOrderPlaced');
          if (lastOrderStr) {
            const lastOrder = JSON.parse(lastOrderStr);
            const timeSinceOrder = Date.now() - lastOrder.timestamp;
            const productIdNum = parseInt(String(productId));

            if (timeSinceOrder < 60000 && lastOrder.productIds?.includes(productIdNum)) {
              console.log('🔄 [ProductDetail] Component mounted with recent order, refreshing...');
              localStorage.removeItem('lastOrderPlaced');
              refreshProductData();
            }
          }
        } catch (e) {
          console.warn('Error checking order on mount:', e);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [productId, refreshProductData]);

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

  // Track product view for recently viewed and smart recommendations
  useEffect(() => {
    if (productWithFlash?.id) {
      // 1. Local Storage Tracking (Independent of auth)
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
        }
      } catch (error) {
        console.error('Error saving recently viewed product to localStorage:', error);
      }

      // 2. Backend Logging (Only if user is logged in)
      if (token) {
        try {
          logView('/personalized-feed/log-view', { product_id: productWithFlash.id }, false);
          console.log('✅ Product view logged to server:', productWithFlash.id);
        } catch (error) {
          console.error('Error logging product view to server:', error);
        }
      }
    }
  }, [token, productWithFlash, logView]);

  const handleQuantityChange = (e) => {
    setQuantity(Math.max(1, parseInt(e.target.value) || 1));
  };

  const handleAddToCart = () => {
    if (!productWithFlash) return;

    // If product has variants but no variant is selected, use the first variant with stock available
    let variantToUse = selectedVariant;
    if (!variantToUse && productWithFlash?.product_variants && Array.isArray(productWithFlash.product_variants) && productWithFlash.product_variants.length > 0) {
      // Find first variant with stock available (quantity > 0 or in_stock === true)
      variantToUse = productWithFlash.product_variants.find(v => {
        const qty = v?.quantity ?? v?.qty ?? 0;
        return qty > 0 || v?.in_stock === true;
      }) || productWithFlash.product_variants[0]; // Fallback to first variant if none have stock
    }

    // Use variant price if variant is selected/auto-selected, otherwise use product price
    const numericBase = variantToUse
      ? Number(variantToUse?.price_tax_excl || variantToUse?.price || 0)
      : Number(productWithFlash?.price_tax_excl || productWithFlash?.price || 0);
    const numericFlash = productWithFlash?.flash_price != null ? Number(productWithFlash.flash_price) : null;
    const chosenPrice = Number.isFinite(numericFlash) ? numericFlash : numericBase;

    // Extract store information from product
    let storeInfo = null;
    if (productWithFlash.store) {
      if (Array.isArray(productWithFlash.store) && productWithFlash.store.length > 0) {
        storeInfo = productWithFlash.store[0];
      } else if (typeof productWithFlash.store === 'object' && !Array.isArray(productWithFlash.store)) {
        storeInfo = productWithFlash.store;
      }
    }

    const payload = {
      id: productWithFlash.id,
      product: productWithFlash,
      price: chosenPrice,
      quantity,
      ...(size ? { size } : {}),
      color: selectedColor,
      batteryLife,
      storage: storage[0],
      ram: ram[0],
      // Include variant_id if a variant is selected or auto-selected
      ...(variantToUse?.id && { variant_id: variantToUse.id, variant: variantToUse }),
      // Include store information at top level for easy access
      ...(storeInfo && { store: storeInfo }),
      // Include store_id from various possible locations
      ...(productWithFlash.store_id && { storeId: productWithFlash.store_id }),
      ...(storeInfo?.id && { storeId: storeInfo.id }),
      // Include shipping charges for dynamic fee calculation
      ...(productWithFlash.shipping_charge_regular && { shipping_charge_regular: productWithFlash.shipping_charge_regular }),
      ...(productWithFlash.shipping_charge_same_day && { shipping_charge_same_day: productWithFlash.shipping_charge_same_day }),
    };

    console.log("Dispatching addItem with payload:", payload);
    if (variantToUse && !selectedVariant) {
      console.log("Auto-selected first variant:", variantToUse.id, "for quantity decrease");
    }
    dispatch(addItem(payload));
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleCheckDelivery = async () => {
    if (!postalCode.trim() || !productWithFlash) return;

    setCheckingDelivery(true);
    setDeliveryAvailable(null);

    try {
      // Get coordinates from postal code
      const { getLatLngFromPostcode } = await import('@/controller/getLatLngFromPostcode');
      const coords = await getLatLngFromPostcode(postalCode.trim(), 'UK');

      if (!coords) {
        setDeliveryAvailable(false);
        setCheckingDelivery(false);
        return;
      }

      // Check if product/store delivers to this location
      const storeLat = productWithFlash?.store?.latitude;
      const storeLng = productWithFlash?.store?.longitude;
      const deliveryRadius = productWithFlash?.delivery_radius || 10; // Default 10km if not specified

      if (storeLat && storeLng) {
        // Calculate distance
        const R = 6371; // Earth's radius in km
        const dLat = (coords.lat - storeLat) * Math.PI / 180;
        const dLng = (coords.lng - storeLng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(storeLat * Math.PI / 180) * Math.cos(coords.lat * Math.PI / 180) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        setDeliveryAvailable(distance <= deliveryRadius);
      } else {
        // If no store location, assume delivery is available
        setDeliveryAvailable(true);
      }
    } catch (error) {
      console.error('Error checking delivery:', error);
      setDeliveryAvailable(false);
    } finally {
      setCheckingDelivery(false);
    }
  };

  // Check if product is favorited on load - Only if user is logged in
  useEffect(() => {
    const checkFavorite = async () => {
      if (!productWithFlash?.id) {
        console.log('⏳ [ProductDetail] Waiting for product ID...');
        return;
      }

      // Only check favorites if user is logged in
      if (!token) {
        console.log('🔒 [ProductDetail] User not logged in, skipping favorite check');
        // Check localStorage as fallback
        try {
          const key = String(productWithFlash.id);
          const saved = JSON.parse(localStorage.getItem('favorites') || '{}');
          const isFav = !!saved[key];
          setIsFavorite(isFav);
        } catch (e) {
          setIsFavorite(false);
        }
        return;
      }

      console.log('🔍 [ProductDetail] Checking favorite status for product:', productWithFlash.id);

      try {
        const isFav = await productFavorites.check(productWithFlash.id);
        console.log('✅ [ProductDetail] Favorite status:', { productId: productWithFlash.id, isFavorite: isFav });
        setIsFavorite(isFav);
      } catch (error) {
        console.error('❌ [ProductDetail] Error checking favorite:', error);
        // Fallback to localStorage
        try {
          const key = String(productWithFlash.id);
          const saved = JSON.parse(localStorage.getItem('favorites') || '{}');
          const isFav = !!saved[key];
          console.log('💾 [ProductDetail] Using localStorage fallback:', { productId: productWithFlash.id, isFavorite: isFav });
          setIsFavorite(isFav);
        } catch (e) {
          console.error('❌ [ProductDetail] Error reading localStorage:', e);
          setIsFavorite(false);
        }
      }
    };

    // Add a small delay to ensure product is fully loaded
    const timer = setTimeout(() => {
      checkFavorite();
    }, 100);

    return () => clearTimeout(timer);
  }, [productWithFlash?.id]);

  const toggleFavorite = async () => {
    if (!productWithFlash?.id) return;

    const wasFavorite = isFavorite;

    // Update UI immediately (optimistic update)
    setIsFavorite(!wasFavorite);

    try {
      // Save to database (with localStorage fallback)
      if (wasFavorite) {
        await productFavorites.remove(productWithFlash.id);
        console.log('❌ [ProductDetail] Removed favorite from database:', { productId: productWithFlash.id });
      } else {
        await productFavorites.add(productWithFlash.id);
        console.log('✅ [ProductDetail] Added favorite to database:', { productId: productWithFlash.id });
      }

      // Also update localStorage as backup
      try {
        const key = String(productWithFlash.id);
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
          detail: { productId: productWithFlash.id, isFavorite: !wasFavorite }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('❌ [ProductDetail] Error toggling favorite:', error);
      // Revert UI on error
      setIsFavorite(wasFavorite);
    }
  };

  const productImages = productWithFlash?.images && productWithFlash.images.length > 0
    ? productWithFlash.images
    : productWithFlash?.featured_image
      ? [{ url: productWithFlash.featured_image.url, alt_text: productWithFlash.name }]
      : [];

  // Helper to build absolute image URL
  const buildImageUrl = (url) => {
    if (!url) return '/images/NoImageLong.jpg';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
    if (apiBase) {
      return url.startsWith('/') ? `${apiBase}${url}` : `${apiBase}/${url}`;
    }
    return url.startsWith('/') ? url : `/${url}`;
  };

  // Determine main image URL - use selected variant image if available, otherwise use product images
  const mainImageUrl = useMemo(() => {
    // If a variant is selected and has an image, use that
    if (selectedVariant?.image) {
      return buildImageUrl(selectedVariant.image);
    }
    // Otherwise use the selected product image
    return productImages[selectedImageIndex]?.url
      ? buildImageUrl(productImages[selectedImageIndex].url)
      : productWithFlash?.featured_image?.url
        ? buildImageUrl(productWithFlash.featured_image.url)
        : '/images/NoImageLong.jpg';
  }, [selectedVariant, productImages, selectedImageIndex, productWithFlash?.featured_image?.url]);

  if (productsLoading || flashLoading || singleProductLoading) {
    return (
      <SharedLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#F44323] mb-4"></div>
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
      <div className="min-h-screen bg-white lg:pb-10 pb-10 font-sans">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {/* Back Button */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <BackButton />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-16">
            {/* Left Column: Image Gallery */}
            <div className="flex flex-col-reverse sm:flex-row gap-4 sm:gap-6">
              {/* Thumbnails (Vertical on desktop) */}
              {productImages.length > 0 && (
                <div className="flex sm:flex-col gap-4 overflow-x-auto sm:overflow-y-auto sm:max-h-[500px] scrollbar-hide py-2 sm:py-0">
                  {productImages.map((image, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative flex-shrink-0 w-18 h-24 overflow-hidden border-0 transition-all ${selectedImageIndex === index
                        ? 'opacity-100'
                        : 'opacity-50'
                        }`}
                    >
                      <img
                        src={image?.url ? buildImageUrl(image.url) : '/images/NoImageLong.jpg'}
                        alt={`View ${index + 1}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.src = '/images/NoImageLong.jpg';
                        }}
                        style={{
                          imageRendering: 'auto',
                          WebkitImageRendering: 'auto',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden'
                        }}
                        loading="lazy"
                      />
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Main Image */}
              <div className="flex-1  relative overflow-hidden group aspect-[3/4] sm:aspect-auto sm:h-[500px] product-image">
                <motion.img
                  key={mainImageUrl}
                  src={mainImageUrl}
                  alt={productWithFlash.name}
                  className="absolute inset-0 w-full h-full object-contain"
                  onMouseEnter={() => setImageZoom(true)}
                  onMouseLeave={() => setImageZoom(false)}
                  onError={(e) => {
                    e.target.src = '/images/NoImageLong.jpg';
                  }}
                  style={{
                    // transform: imageZoom ? 'scale(1.1) translateZ(0)' : 'scale(1) translateZ(0)',
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    imageRendering: 'auto',
                    WebkitImageRendering: 'auto',
                    willChange: 'transform',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden'
                  }}
                  loading="eager"
                />
              </div>
            </div>

            {/* Right Column: Product Details */}
            <div className="flex flex-col pt-2">
              {/* Rating Summary - Only show if there are reviews */}
              {ratingData?.data && ratingData.data.review_count > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${star <= (ratingData.data.average_rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {Number(ratingData.data.average_rating || 0).toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-400">
                    ({ratingData.data.review_count || 0} {t('common.reviews')})
                  </span>
                </div>
              )}

              <h1 className=" xl:text-[42.15px] lg:text-4xl md:text-3xl sm:text-2xl text-xl font-semibold text-[#092E3B] mb-3 sm:mb-4 tracking-tight">
                {productWithFlash.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-2 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
                <span className="text-2xl md:text-3xl lg:text-[33px] font-semibold text-[#092E3B]">
                  {formatPrice(currentPrice)}
                </span>
                <span className="text-2xl md:text-[25px] text-[#A0A0A0] line-through">
                  {formatPrice(currentPrice)}
                </span>
                {(() => {
                  const comparedPrice = selectedVariant?.compared_price || productWithFlash?.compared_price;
                  if (comparedPrice && comparedPrice > currentPrice) {
                    return (
                      <span className="text-lg sm:text-xl md:text-2xl text-[#D5D5D5] font-medium line-through">
                        {formatPrice(comparedPrice)}
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Dynamic Variant Attributes (Color, Storage, etc.) */}
              <div className="mb-6">
                {Object.entries(getVariantAttributes).map(([attrName, values]) => {
                  const isColor = attrName.toLowerCase() === 'color';

                  return (
                    <div key={attrName} className="mb-6">
                      <p className="text-[15px] font-normal text-[#0C0C0C] mb-3">
                        Select {attrName.toLowerCase()} :
                      </p>
                      
                      <div className="flex flex-wrap gap-3">
                        {values.map((value) => {
                          const isSelected = selectedAttributes[attrName] === value;
                          
                          if (isColor) {
                            return (
                              <button
                                key={value}
                                onClick={() => handleAttributeSelect(attrName, value)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${isSelected
                                  ? 'border-black scale-110 shadow-md'
                                  : 'border-transparent hover:scale-105'
                                }`}
                                style={{ backgroundColor: value, border: isSelected ? '2px solid #000' : '1px solid #e5e7eb' }}
                                title={value}
                              />
                            );
                          }

                          return (
                            <button
                              key={value}
                              onClick={() => handleAttributeSelect(attrName, value)}
                              className={`px-4 lg:px-[25.72px] lg:h-[50px] h-[40px] rounded-[8px] border-[1.05px] font-medium transition-all ${isSelected
                                ? 'border-[#F44323] text-[#F44323]'
                                : 'border-[#D5D5D5] text-[#6F6F6F] hover:border-gray-400'
                              }`}
                            >
                              {value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Fallback for explicit state 'storage' if dynamic attributes are missing */}
                {(!getVariantAttributes['Storage'] && !getVariantAttributes['storage']) && storage.length > 0 && (
                  <div className="mb-8">
                    <p className="text-[15px] font-normal text-[#0C0C0C] mb-3">Select storage :</p>
                    <div className="flex flex-wrap gap-3">
                      {storage.map((s) => (
                        <button
                          key={s}
                          onClick={() => setStorage([s])}
                          className={`px-6 py-3 rounded-[8px] border text-sm font-bold transition-all min-w-[80px] ${(storage[0] === s)
                            ? 'border-[#F44323] text-[#F44323]'
                            : 'border-gray-200 text-gray-400 hover:border-[#D5D5D5]'
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-8">
                <p className="text-[#6C6C6C] font-normal text-sm leading-relaxed mb-1 line-clamp-3">
                  {productWithFlash.short_description || productWithFlash.description || "Enhanced capabilities thanks to an enlarged display of 6.7 inches and work without recharging throughout the day. Incredible photos as in weak, yes and in bright light using the new system with two cameras..."}
                  <button className="text-[#2C2C2C] font-normal ml-1 text-sm underline decoration-2 underline-offset-4">
                    more...
                  </button>
                </p>

              </div>

              {/* Info Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
                {/* Delivery Info */}
                {(() => {
                  const regularShippingCharge = productWithFlash?.shipping_charge_regular ?? storeInfo?.shipping_charge_regular;
                  const isFreeDelivery = regularShippingCharge === 0;
                  const deliveryText = isFreeDelivery ? 'Free Delivery' : formatPrice(regularShippingCharge || 0);
                  const readyInMinutes = productWithFlash?.ready_in_minutes ?? storeInfo?.ready_in_minutes ?? 45;
                  
                  const deliveryTime = productWithFlash?.delivery_days
                    ? `${productWithFlash.delivery_days} ${productWithFlash.delivery_days === 1 ? 'day' : 'days'}`
                    : readyInMinutes
                      ? (readyInMinutes < 60
                        ? `${readyInMinutes} min`
                        : readyInMinutes < 1440
                          ? `${Math.ceil(readyInMinutes / 60)} hour${Math.ceil(readyInMinutes / 60) > 1 ? 's' : ''}`
                          : `${Math.ceil(readyInMinutes / 1440)} day${Math.ceil(readyInMinutes / 1440) > 1 ? 's' : ''}`)
                      : '1-2 days';

                  return (
                    <div className=" flex items-center gap-4">
                      <div className="w-10 lg:w-[69px] h-10 lg:h-[69px] bg-[#F6F6F6] rounded-xl flex items-center justify-center text-[#717171]">
                        <TruckIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[#717171] text-xs md:text-[14.75px] font-normal">Delivery </p>
                        <p className="text-black text-[14.75px] font-semibold">{deliveryTime}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* In Stock */}
                <div className=" flex items-center gap-4">
                  <div className="w-10 lg:w-[69px] h-10 lg:h-[69px] bg-[#F6F6F6] rounded-xl flex items-center justify-center text-[#717171]">
                    <CheckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[#717171] text-xs md:text-[14.75px] font-normal">In Stock</p>
                    <p className="text-black text-[14.75px] font-semibold">
                      {currentQuantity > 0 ? (currentQuantity < 10 ? `0${currentQuantity}` : currentQuantity) : '00'}
                    </p>
                  </div>
                </div>

                {/* Categories */}
                <div className=" flex items-center gap-4">
                  <div className="w-10 lg:w-[69px] h-10 lg:h-[69px] bg-[#F6F6F6] rounded-xl flex items-center justify-center text-[#717171]">
                    <ShieldCheckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[#717171] text-xs md:text-[14.75px] font-normal">Categories</p>
                    <p className="text-black text-[14.75px] font-semibold truncate">
                      {productWithFlash.categories && productWithFlash.categories.length > 0
                        ? productWithFlash.categories[0].name
                        : 'Mobile'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={currentQuantity === 0}
                className={`w-full  lg:h-[60px] h-[40px] rounded-[6px] text-white font-medium text-base transition-transform active:scale-95 ${currentQuantity > 0 ? 'bg-[#F44323] hover:bg-[#F44323]' : 'bg-gray-400 cursor-not-allowed'
                  }`}
              >
                {currentQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>

          {/* Bottom Info Section - Redesigned */}
          <div className="pt-8 sm:pt-12 md:pt-16">
            {/* Added: items-stretch to ensure equal height columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-24 items-stretch">
              {/* Product Information Column */}
              <div className="flex flex-col lg:gap-8 gap-4">
                <div className="border border-[#D8DADC] rounded-[8px] p-4 sm:p-6 md:p-8 h-full">
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#000000] mb-4 sm:mb-6">
                    Product Information
                  </h3>
                  <div className="text-[#9D9D9D] font-medium text-sm leading-7 space-y-4 mb-8">
                    <p>
                      {productWithFlash.description
                        ? productWithFlash.description
                        : "Just as a book is judged by its cover, the first thing you notice when you pick up a modern smartphone is the display. Nothing surprising, because advanced technologies allow you to practically level the display frames and cutouts for the front camera and speaker, leaving no room for bold design solutions. And how good that in such realities Apple everything is fine with displays."}
                    </p>
                  </div>

                  {/* Screen Details Section - Dynamic */}
                  {(() => {
                    const screenDiagonal = productWithFlash.product_attributes?.find(a => a.attribute_name?.toLowerCase() === 'screen diagonal')?.attribute_value;
                    const screenResolution = productWithFlash.product_attributes?.find(a => a.attribute_name?.toLowerCase() === 'the screen resolution' || a.attribute_name?.toLowerCase() === 'resolution')?.attribute_value;
                    const screenRefreshRate = productWithFlash.product_attributes?.find(a => a.attribute_name?.toLowerCase() === 'the screen refresh rate' || a.attribute_name?.toLowerCase() === 'refresh rate')?.attribute_value;
                    const pixelDensity = productWithFlash.product_attributes?.find(a => a.attribute_name?.toLowerCase() === 'the pixel density' || a.attribute_name?.toLowerCase() === 'pixel density')?.attribute_value;
                    const screenType = productWithFlash.product_attributes?.find(a => a.attribute_name?.toLowerCase() === 'screen type')?.attribute_value;
                    const additionally = productWithFlash.product_attributes?.find(a => a.attribute_name?.toLowerCase() === 'additionally')?.attribute_value;

                    const hasScreenData = screenDiagonal || screenResolution || screenRefreshRate || pixelDensity || screenType || additionally;

                    if (!hasScreenData) return null;

                    return (
                      <div className="mb-8">
                        <div className="pb-3">
                          <h4 className="lg:text-xl text-base font-semibold text-[#000000] mb-2">Screen</h4>
                        </div>
                        <div className="space-y-2">
                          {screenDiagonal && (
                            <div className="py-2 pt-2 font-medium flex justify-between items-center text-sm border-b border-[#CDCDCD]">
                              <span className="text-[#000000] font-normal">Screen diagonal</span>
                              <span className="text-[#000000] font-normal">{Array.isArray(screenDiagonal) ? screenDiagonal.join(', ') : screenDiagonal}</span>
                            </div>
                          )}
                          {screenResolution && (
                            <div className="py-2 font-medium flex justify-between items-center text-sm border-b border-[#CDCDCD]">
                              <span className="text-[#000000] font-normal">The screen resolution</span>
                              <span className="text-[#000000] font-normal">{Array.isArray(screenResolution) ? screenResolution.join(', ') : screenResolution}</span>
                            </div>
                          )}
                          {screenRefreshRate && (
                            <div className="py-2 font-medium flex justify-between items-center text-sm border-b border-[#CDCDCD]">
                              <span className="text-[#000000] font-normal">The screen refresh rate</span>
                              <span className="text-[#000000] font-normal">{Array.isArray(screenRefreshRate) ? screenRefreshRate.join(', ') : screenRefreshRate}</span>
                            </div>
                          )}
                          {pixelDensity && (
                            <div className="py-2 font-medium flex justify-between items-center text-sm border-b border-[#CDCDCD]">
                              <span className="text-[#000000] font-normal">The pixel density</span>
                              <span className="text-[#000000] font-normal">{Array.isArray(pixelDensity) ? pixelDensity.join(', ') : pixelDensity}</span>
                            </div>
                          )}
                          {screenType && (
                            <div className="py-2 font-medium flex justify-between items-center text-sm border-b border-[#CDCDCD]">
                              <span className="text-[#000000] font-normal">Screen type</span>
                              <span className="text-[#000000] font-normal">{Array.isArray(screenType) ? screenType.join(', ') : screenType}</span>
                            </div>
                          )}
                          {additionally && (
                            <div className="px-6 py-3 flex justify-between items-start text-sm">
                              <span className="text-[#000000] font-normal">Additionally</span>
                              <div className="text-right text-[#000000] font-normal space-y-1">
                                {(Array.isArray(additionally) ? additionally : String(additionally).split(',')).map((item, idx) => (
                                  <div key={idx}>{String(item).trim()}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Box Contents Section - Dynamic */}
                  {productWithFlash.box_contents && (
                    <div className="mb-8">
                      <div className="pb-3 border-b border-[#CDCDCD]">
                        <h4 className="lg:text-xl text-base font-semibold text-[#000000] mb-2">What's in the Box</h4>
                      </div>
                      <div className="py-4 text-[#6C6C6C] text-sm leading-relaxed">
                        {productWithFlash.box_contents}
                      </div>
                    </div>
                  )}

                  {/* Specifications Section - Merged & Dynamic */}
                  {(() => {
                    const hasManualSpecs = productWithFlash.condition || productWithFlash.warranty || productWithFlash.sku || productWithFlash.weight;
                    const dynamicAttributes = productWithFlash.product_attributes?.filter(attr =>
                      !['color', 'size', 'storage', 'ram', 'battery life', 'screen diagonal', 'the screen resolution', 'resolution', 'the screen refresh rate', 'refresh rate', 'the pixel density', 'pixel density', 'screen type', 'additionally'].includes(attr.attribute_name?.toLowerCase())
                    ) || [];

                    const hasDynamicSpecs = dynamicAttributes.length > 0;

                    if (!hasManualSpecs && !hasDynamicSpecs) return null;

                    return (
                      <div className="mb-8">
                        <div className="pb-3 border-b border-[#CDCDCD] mb-4">
                          <h4 className="lg:text-xl text-base font-semibold text-[#000000] mb-2">Specifications</h4>
                        </div>
                        <div className="space-y-3">
                          {/* Built-in Fields */}
                          {productWithFlash.sku && (
                            <div className="flex justify-between items-center text-sm pb-2 border-b border-gray-50 last:border-0">
                              <span className="text-gray-900 font-medium">SKU</span>
                              <span className="text-gray-500 font-medium">{productWithFlash.sku}</span>
                            </div>
                          )}
                          {productWithFlash.condition && (
                            <div className="flex justify-between items-center text-sm pb-2 border-b border-gray-50 last:border-0">
                              <span className="text-gray-900 font-medium">Condition</span>
                              <span className="text-gray-500 font-medium capitalize">{productWithFlash.condition}</span>
                            </div>
                          )}
                          {productWithFlash.warranty && (
                            <div className="flex justify-between items-center text-sm pb-2 border-b border-gray-50 last:border-0">
                              <span className="text-gray-900 font-medium">Warranty</span>
                              <span className="text-gray-500 font-medium">{productWithFlash.warranty}</span>
                            </div>
                          )}
                          {(Number(productWithFlash.weight) > 0) && (
                            <div className="flex justify-between items-center text-sm pb-2 border-b border-gray-50 last:border-0">
                              <span className="text-gray-900 font-medium">Weight</span>
                              <span className="text-gray-500 font-medium">{productWithFlash.weight} kg</span>
                            </div>
                          )}
                          {(Number(productWithFlash.width) > 0 || Number(productWithFlash.height) > 0) && (
                            <div className="flex justify-between items-center text-sm pb-2 border-b border-gray-50 last:border-0">
                              <span className="text-gray-900 font-medium">Dimensions</span>
                              <span className="text-gray-500 font-medium">
                                {productWithFlash.width || 0} x {productWithFlash.height || 0} x {productWithFlash.depth || 0} cm
                              </span>
                            </div>
                          )}

                          {/* Dynamic Attributes */}
                          {dynamicAttributes.map((attr, idx) => (
                            <div key={`${attr.attribute_name}-${idx}`} className="flex justify-between items-center text-sm pb-2 border-b border-gray-50 last:border-0">
                              <span className="text-gray-900 font-medium">{attr.attribute_name}</span>
                              <span className="text-gray-500 font-medium">
                                {Array.isArray(attr.attribute_value) ? attr.attribute_value.join(', ') : attr.attribute_value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* "Additionally" Section - Tags */}
                  {productWithFlash.tags && productWithFlash.tags.length > 0 && (
                    <div className="flex justify-between items-start text-sm pt-4 mt-2">
                      <span className="text-gray-900 font-medium">Features</span>
                      <div className="text-right text-gray-500 font-medium space-y-1">
                        {productWithFlash.tags.map(tag => (
                          <div key={tag.name || tag}>{typeof tag === 'object' ? tag.name : tag}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping & Delivery Column */}
              <div className="flex flex-col">
                <div className="border border-[#D8DADC] rounded-[8px] p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 flex-1">
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#000000] mb-4 sm:mb-6">Shipping & Delivery</h3>
                  <div className="text-[#000000] font-medium text-sm leading-6 sm:leading-7 space-y-3 sm:space-y-4 mb-4 sm:mb-6 md:mb-8">
                    <p>
                      {productWithFlash.shipping_policy || storeInfo?.shipping_policy || "Standard shipping policy applies to all orders. Please check availability at checkout."}
                    </p>
                  </div>

                  <h4 className="lg:text-xl text-base font-semibold text-[#000000] mb-3 sm:mb-4">Details</h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center text-xs sm:text-sm pb-2 sm:pb-3 border-b border-[#CDCDCD] last:border-0">
                      <span className="text-[#000000] font-normal">Regular Shipping</span>
                      <span className="text-[#000000] font-normal">
                        {formatPrice(productWithFlash.shipping_charge_regular ?? storeInfo?.shipping_charge_regular ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pb-3 border-b border-[#CDCDCD] last:border-0">
                      <span className="text-[#000000] font-normal">Same Day Delivery</span>
                      <span className="text-[#000000] font-normal">
                        {formatPrice(productWithFlash.shipping_charge_same_day ?? storeInfo?.shipping_charge_same_day ?? 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pb-3 border-b border-[#CDCDCD] last:border-0">
                      <span className="text-[#000000] font-normal">Delivery Radius</span>
                      <span className="text-[#000000] font-normal">
                        {productWithFlash.delivery_radius ?? storeInfo?.delivery_radius ?? 10} km
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pb-3 border-b border-[#CDCDCD] last:border-0">
                      <span className="text-[#000000] font-normal">Ready in</span>
                      <span className="text-[#000000] font-normal">
                        {productWithFlash.ready_in_minutes ?? storeInfo?.ready_in_minutes ?? 45} Minutes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Store & Returns Card */}
                <div className="border border-[#D8DADC] rounded-[8px] mb-4 sm:mb-6 flex-1">
                  {/* Store Row */}
                  <div className="p-3 sm:p-4 flex items-start gap-3 sm:gap-4 border-b border-[#CDCDCD]">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#717171]" />
                    </div>
                    <div>
                      <h4 className="text-[#092E3B] font-medium text-sm sm:text-base mb-1">
                        {productWithFlash.store?.name || 'Verified Store'}
                      </h4>
                      <p className="text-[#000000] font-medium text-xs">Enter your postal code for Delivery Availability</p>
                    </div>
                  </div>

                  {/* Return Row */}
                  <div className="p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                      <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                    </div>
                    <div>
                      <h4 className="text-[#092E3B] font-bold text-xs sm:text-sm mb-1">Return Delivery</h4>
                      <p className="text-gray-500 text-xs text-left">
                        {productWithFlash.returns || productWithFlash.return_policy || storeInfo?.return_policy || "Free 30 Days Delivery Returns. Details"}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Reviews Section - Content moved to bottom TestimonialSection */}
            <div className="mt-8 border-t border-gray-100"></div>
          </div>

          {/* Success Toast */}
          <AnimatePresence>
            {showSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-4 right-4 sm:bottom-10 sm:right-10 z-50 bg-gray-900 text-white px-4 py-3 sm:px-6 sm:py-4 rounded-xl shadow-2xl flex items-center gap-2 sm:gap-3 max-w-[90vw] sm:max-w-none"
              >
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-bold">Added to Cart</p>
                  <p className="text-gray-400 text-sm">{productWithFlash.name}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      <TestimonialSection productId={productId} />
      {/* <ProductDetailSection /> */}
    </SharedLayout>
  );
}
