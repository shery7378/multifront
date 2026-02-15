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
import ReviewSlider from "@/components/ReviewSlider";
import { useI18n } from '@/contexts/I18nContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import BackButton from "@/components/UI/BackButton";
import SharedLayout from "@/components/SharedLayout";
import { useSelector } from "react-redux";
import { productFavorites } from "@/utils/favoritesApi";

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

  // Track product view for recently viewed - Only if user is logged in
  useEffect(() => {
    // Only save recently viewed if user is logged in
    if (!token) {
      console.log('🔒 User not logged in, skipping recently viewed save');
      return;
    }

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
  }, [token, productWithFlash?.id]);

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
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(storeLat * Math.PI / 180) * Math.cos(coords.lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
      } catch {}
      
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
      <div className="min-h-screen bg-white pb-20 font-sans">
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
                      className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-blue-600 ring-2 ring-blue-100'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                      style={{
                        borderColor: selectedImageIndex === index ? '#6B21A8' : undefined
                      }}
                    >
                      <img
                        src={image?.url ? buildImageUrl(image.url) : '/images/NoImageLong.jpg'}
                        alt={`View ${index + 1}`}
                        className="w-full h-full object-cover"
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
              <div className="flex-1 bg-gray-50 rounded-3xl relative overflow-hidden group aspect-[3/4] sm:aspect-auto sm:h-[500px] product-image">
                <motion.img
                  key={mainImageUrl}
                  src={mainImageUrl}
                  alt={productWithFlash.name}
                  className="absolute inset-0 w-full h-full object-contain drop-shadow-xl"
                  onMouseEnter={() => setImageZoom(true)}
                  onMouseLeave={() => setImageZoom(false)}
                  onError={(e) => {
                    e.target.src = '/images/NoImageLong.jpg';
                  }}
                  style={{
                    transform: imageZoom ? 'scale(1.1) translateZ(0)' : 'scale(1) translateZ(0)',
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
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B1537] mb-3 sm:mb-4 tracking-tight">
                {productWithFlash.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-2 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0B1537]">
                  {formatPrice(currentPrice)}
                </span>
                {(() => {
                   const comparedPrice = selectedVariant?.compared_price || productWithFlash?.compared_price;
                   if (comparedPrice && comparedPrice > currentPrice) {
                     return (
                        <span className="text-lg sm:text-xl md:text-2xl text-gray-300 font-medium line-through">
                          {formatPrice(comparedPrice)}
                        </span>
                     );
                   }
                   return null;
                })()}
              </div>

              {/* Select Color */}
              {(() => {
                const colors = getVariantAttributes['Color'] || getVariantAttributes['color'] || colorsArray;
                if (colors && colors.length > 0) {
                  return (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-medium text-gray-900">Select color :</span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {colors.map((color) => {
                          const isSelected = selectedAttributes['Color'] === color || selectedAttributes['color'] === color || selectedColor === color;
                          return (
                            <button
                              key={color}
                              onClick={() => {
                                handleAttributeSelect('Color', color);
                                setSelectedColor(color);
                              }}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                isSelected 
                                  ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' 
                                  : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: color, border: '1px solid #e5e7eb' }}
                              title={color}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Select Storage / Other Variants */}
              {Object.entries(getVariantAttributes).map(([attrName, values]) => {
                if (attrName.toLowerCase() === 'color') return null;
                return (
                  <div key={attrName} className="mb-8">
                     <div className="flex flex-wrap gap-3">
                       {values.map((value) => {
                         const isSelected = selectedAttributes[attrName] === value;
                         return (
                           <button
                             key={value}
                             onClick={() => handleAttributeSelect(attrName, value)}
                             className={`px-6 py-3 rounded-xl border text-sm font-bold transition-all min-w-[80px] ${
                               isSelected
                                 ? 'border-[#F24E2E] text-[#F24E2E]'
                                 : 'border-gray-200 text-gray-400 hover:border-gray-300'
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

              {/* Fallback for explicit state 'storage' if attributes are missing */}
              {(!getVariantAttributes['Storage'] && !getVariantAttributes['storage']) && storage.length > 0 && (
                 <div className="mb-8">
                     <div className="flex flex-wrap gap-3">
                       {storage.map((s) => (
                           <button
                             key={s}
                             onClick={() => setStorage([s])}
                             className={`px-6 py-3 rounded-xl border text-sm font-bold transition-all min-w-[80px] ${
                               (storage[0] === s)
                                 ? 'border-[#F24E2E] text-[#F24E2E]'
                                 : 'border-gray-200 text-gray-400 hover:border-gray-300'
                             }`}
                           >
                             {s}
                           </button>
                       ))}
                     </div>
                  </div>
              )}

              {/* Description */}
              <div className="mb-8">
                <p className="text-gray-500 text-sm leading-relaxed mb-1 line-clamp-3">
                  {productWithFlash.short_description || productWithFlash.description || "Enhanced capabilities thanks to an enlarged display of 6.7 inches and work without recharging throughout the day. Incredible photos as in weak, yes and in bright light using the new system with two cameras..."}
                </p>
                <button className="text-gray-900 font-bold text-sm underline decoration-2 underline-offset-4">
                  more...
                </button>
              </div>

              {/* Info Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
                {/* Delivery Info */}
                {(() => {
                  const regularShippingCharge = productWithFlash?.shipping_charge_regular;
                  const isFreeDelivery = !regularShippingCharge || regularShippingCharge === 0;
                  const deliveryText = isFreeDelivery ? 'Free Delivery' : formatPrice(regularShippingCharge);
                  const deliveryTime = productWithFlash?.delivery_days 
                    ? `${productWithFlash.delivery_days} ${productWithFlash.delivery_days === 1 ? 'day' : 'days'}`
                    : productWithFlash?.ready_in_minutes 
                      ? (productWithFlash.ready_in_minutes < 60 
                          ? `${productWithFlash.ready_in_minutes} min`
                          : productWithFlash.ready_in_minutes < 1440
                            ? `${Math.ceil(productWithFlash.ready_in_minutes / 60)} hour${Math.ceil(productWithFlash.ready_in_minutes / 60) > 1 ? 's' : ''}`
                            : `${Math.ceil(productWithFlash.ready_in_minutes / 1440)} day${Math.ceil(productWithFlash.ready_in_minutes / 1440) > 1 ? 's' : ''}`)
                      : '1-2 days';
                  
                  return (
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-400 shadow-sm">
                        <TruckIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs font-medium">Delivery </p>
                        <p className="text-gray-900 text-sm font-bold">{deliveryTime}</p>
                      </div>
                    </div>
                  );
                })()}
                
                {/* In Stock */}
                <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-400 shadow-sm">
                     <CheckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium">In Stock</p>
                    <p className="text-gray-900 text-sm font-bold">
                       {currentQuantity > 0 ? (currentQuantity < 10 ? `0${currentQuantity}` : currentQuantity) : '00'}
                    </p>
                  </div>
                </div>

                {/* Categories */}
                <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-400 shadow-sm">
                    <ShieldCheckIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium">Categories</p>
                    <p className="text-gray-900 text-sm font-bold truncate">
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
                 className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-orange-200 transition-transform active:scale-95 ${
                    currentQuantity > 0 ? 'bg-[#F24E2E] hover:bg-[#d63d1f]' : 'bg-gray-400 cursor-not-allowed'
                 }`}
              >
                 {currentQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>

          {/* Bottom Info Section - Redesigned */}
          <div className="mt-10 sm:mt-16 md:mt-20 pt-8 sm:pt-12 md:pt-16 border-t border-gray-100">
            {/* Added: items-stretch to ensure equal height columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-24 items-stretch">
              {/* Product Information Column */}
              <div className="flex flex-col">
                {/* Added: h-full to make card stretch */}
                <div className="border border-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 h-full">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0B1537] mb-4 sm:mb-6">Product Information</h3>
                    <div className="text-gray-500 text-sm leading-7 space-y-4 mb-8">
                      <p>
                        {productWithFlash.description 
                           ? productWithFlash.description 
                           : "Just as a book is judged by its cover, the first thing you notice when you pick up a modern smartphone is the display. Nothing surprising, because advanced technologies allow you to practically level the display frames and cutouts for the front camera and speaker, leaving no room for bold design."}
                      </p>
                    </div>

                    {/* Dynamic Product Attributes - Only show if data exists */}
                    {productWithFlash.product_attributes && productWithFlash.product_attributes.length > 0 && productWithFlash.product_attributes.some(attr => !['color', 'size', 'storage', 'ram', 'battery life'].includes(attr.attribute_name?.toLowerCase())) && (
                        <>
                            <h4 className="text-lg font-bold text-[#0B1537] mb-4">Specifications</h4>
                            <div className="space-y-4">
                               {productWithFlash.product_attributes
                                 .filter(attr => !['color', 'size', 'storage', 'ram', 'battery life'].includes(attr.attribute_name?.toLowerCase()))
                                 .map((attr, idx) => (
                                    <div key={`${attr.attribute_name}-${idx}`} className="flex justify-between items-center text-sm pb-2 border-b border-gray-50 last:border-0">
                                        <span className="text-gray-900 font-medium">{attr.attribute_name}</span>
                                        <span className="text-gray-500 font-medium">
                                            {Array.isArray(attr.attribute_value) ? attr.attribute_value.join(', ') : attr.attribute_value}
                                        </span>
                                    </div>
                                 ))}
                            </div>
                        </>
                    )}
                        
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
                <div className="border border-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0B1537] mb-4 sm:mb-6">Shipping & Delivery</h3>
                    <div className="text-gray-500 text-xs sm:text-sm leading-6 sm:leading-7 space-y-3 sm:space-y-4 mb-4 sm:mb-6 md:mb-8">
                       <p>
                        {productWithFlash.shipping_policy || "Standard shipping policy applies to all orders. Please check availability at checkout."}
                      </p>
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-[#0B1537] mb-3 sm:mb-4">Details</h4>
                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex justify-between items-center text-xs sm:text-sm pb-2 sm:pb-3 border-b border-gray-50 last:border-0">
                            <span className="text-gray-900 font-medium">Regular Shipping</span>
                            <span className="text-gray-500 font-medium">
                                {productWithFlash.shipping_charge_regular ? formatPrice(productWithFlash.shipping_charge_regular) : 'Free'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm pb-3 border-b border-gray-50 last:border-0">
                            <span className="text-gray-900 font-medium">Same Day Delivery</span>
                            <span className="text-gray-500 font-medium">
                                {productWithFlash.shipping_charge_same_day ? formatPrice(productWithFlash.shipping_charge_same_day) : 'Free'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm pb-3 border-b border-gray-50 last:border-0">
                            <span className="text-gray-900 font-medium">Delivery Radius</span>
                            <span className="text-gray-500 font-medium">
                                {productWithFlash.delivery_radius ? `${productWithFlash.delivery_radius} km` : 'Region varies'}
                            </span>
                        </div>
                         <div className="flex justify-between items-center text-sm pb-3 border-b border-gray-50 last:border-0">
                            <span className="text-gray-900 font-medium">Ready in</span>
                            <span className="text-gray-500 font-medium">{productWithFlash.ready_in_minutes ? `${productWithFlash.ready_in_minutes} Minutes` : '24 Hours'}</span>
                        </div>
                    </div>
                </div>
                
                 {/* Store & Returns Card */}
                <div className="border border-gray-100 rounded-2xl sm:rounded-3xl overflow-hidden mt-auto">
                    {/* Store Row */}
                    <div className="p-4 sm:p-5 md:p-6 flex items-start gap-3 sm:gap-4 border-b border-gray-100">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
                            <TruckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                        </div>
                        <div>
                            <h4 className="text-[#0B1537] font-bold text-xs sm:text-sm mb-1">
                                {productWithFlash.store?.name || 'Verified Store'}
                            </h4>
                            <p className="text-gray-500 text-xs">Enter your postal code for Delivery Availability</p>
                        </div>
                    </div>
                    
                    {/* Return Row */}
                    <div className="p-4 sm:p-5 md:p-6 flex items-start gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center flex-shrink-0">
                             <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                        </div>
                        <div>
                            <h4 className="text-[#0B1537] font-bold text-xs sm:text-sm mb-1">Return Delivery</h4>
                            <p className="text-gray-500 text-xs text-left">
                                {productWithFlash.return_policy || "Free 30 Days Delivery Returns. Details"}
                            </p>
                        </div>
                    </div>
                </div>

              </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-8 sm:mt-12 md:mt-16">
               <ReviewSlider 
                 ratingData={ratingData?.data} 
                 reviews={reviews} 
                 vendorData={vendorData?.data}
               />
            </div>
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
    </SharedLayout>
  );
}
