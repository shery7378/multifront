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
      <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 min-h-screen">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="mb-4 sm:mb-6">
            <BackButton variant="gradient" showLabel={true} />
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {showSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="fixed top-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 sm:px-6 py-3.5 rounded-xl flex items-center gap-3 text-sm sm:text-base backdrop-blur-sm border border-green-400/30"
              >
                <div className="bg-white/20 rounded-full p-1">
                  <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                </div>
                <span className="truncate font-semibold">Product added to cart successfully!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/50"
          >
            {/* Header Actions - Redesigned */}
            <div className="relative bg-gradient-to-r from-[#F24E2E] via-orange-500 to-pink-500 p-4 sm:p-6">
              <div className="absolute inset-0 bg-black/5"></div>
              <div className="relative flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {discount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-white text-[#F24E2E] text-xs sm:text-sm font-extrabold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 border-white/50"
                    >
                      🔥 -{discount}% OFF
                    </motion.span>
                  )}
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/30">
                    ✓ {t('common.inStock')}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <motion.button
                    onClick={toggleFavorite}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2.5 sm:p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 border border-white/30"
                  >
                    {isFavorite ? (
                      <HeartSolidIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    ) : (
                      <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2.5 sm:p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 border border-white/30"
                  >
                    <ShareIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </motion.button>
                </div>
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
                    key={mainImageUrl} // Force re-render when variant changes
                    src={mainImageUrl}
                    alt={productWithFlash.name}
                    className={`max-w-full max-h-full w-auto h-auto object-contain ${
                      imageZoom ? 'scale-110' : 'scale-100'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
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
                        className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden border-2 touch-manipulation ${
                          selectedImageIndex === index
                            ? 'border-[#F24E2E] ring-2 ring-[#F24E2E]/30'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={
                            image?.url
                              ? buildImageUrl(image.url)
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
                  {(() => {
                    const avgRating = ratingData?.data?.average_rating ?? 0;
                    const reviewCount = ratingData?.data?.review_count ?? 0;
                    const displayRating = typeof avgRating === 'number' ? avgRating : 0;
                    const displayReviewCount = typeof reviewCount === 'number' ? reviewCount : 0;
                    
                    return (
                      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => {
                              const starValue = i + 1;
                              const isFilled = starValue <= Math.floor(displayRating);
                              const isHalfFilled = !isFilled && (starValue - 0.5) <= displayRating;
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
                            {displayRating.toFixed(1)} ({displayReviewCount} {t('common.reviews')})
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Price - Updates based on selected variant */}
                {(currentPrice > 0) && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-red-100">
                  <div className="flex items-baseline gap-2 sm:gap-4 flex-wrap">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F24E2E]">
                      {formatPrice(currentPrice)}
                    </span>
                    {(() => {
                      const comparedPrice = selectedVariant?.compared_price || productWithFlash?.compared_price;
                      const saveAmount = comparedPrice && currentPrice 
                        ? comparedPrice - currentPrice 
                        : 0;
                      const hasDiscount = comparedPrice && saveAmount > 0;
                      
                      if (!hasDiscount) return null;
                      
                      return (
                        <div className="flex flex-col">
                          <span className="text-base sm:text-lg text-gray-400 line-through">
                            {formatPrice(comparedPrice)}
                          </span>
                          <span className="text-xs sm:text-sm text-green-600 font-semibold">
                            Save {formatPrice(saveAmount)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  {selectedVariant && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-2">
                      Price for selected variant
                    </p>
                  )}
                </div>
                )}

                {/* Stock & Quantity Info - Daraz Style */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${currentQuantity > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={`text-sm sm:text-base font-semibold ${currentQuantity > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {currentQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                    {currentQuantity > 0 && (
                      <span className="text-sm sm:text-base text-gray-700">
                        <span className="font-semibold">Available Quantity:</span> <span className="text-[#F24E2E] font-bold">{currentQuantity}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* SKU */}
                {productWithFlash.sku && (
                  <div className="text-xs sm:text-sm text-gray-500">
                    <span className="font-medium">SKU:</span> {productWithFlash.sku}
                  </div>
                )}

                {/* Short Description */}
                {productWithFlash.short_description && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      {productWithFlash.short_description}
                    </p>
                  </div>
                )}

                {/* Description */}
                {productWithFlash.description && (
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line">
                      {productWithFlash.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {productWithFlash.tags && Array.isArray(productWithFlash.tags) && productWithFlash.tags.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {productWithFlash.tags.map((tag) => (
                        <span
                          key={tag.id || tag.name}
                          className="inline-block bg-white text-purple-700 text-xs px-2 py-1 rounded-full border border-purple-300"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {productWithFlash.categories && Array.isArray(productWithFlash.categories) && productWithFlash.categories.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {productWithFlash.categories.map((category) => (
                        <span
                          key={category.id}
                          className="inline-block bg-white text-green-700 text-xs px-2 py-1 rounded-full border border-green-300"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Product Attributes */}
                {productWithFlash.product_attributes && Array.isArray(productWithFlash.product_attributes) && productWithFlash.product_attributes.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg sm:rounded-xl p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Product Attributes</h3>
                    <div className="space-y-2">
                      {productWithFlash.product_attributes
                        .filter(attr => !attr.variant_id) // Only show product-level attributes, not variant-specific
                        .filter(attr => {
                          // Filter out attributes already shown in variants section
                          const attrName = attr.attribute_name?.toLowerCase();
                          return !['color', 'size', 'storage', 'ram', 'battery life'].includes(attrName);
                        })
                        .map((attr, index) => (
                          <div key={attr.id || index} className="flex justify-between items-start py-2 border-b border-yellow-300 last:border-b-0">
                            <span className="text-sm font-medium text-gray-700">{attr.attribute_name}:</span>
                            <span className="text-sm text-gray-600 text-right ml-4">
                              {Array.isArray(attr.attribute_value) 
                                ? attr.attribute_value.join(', ') 
                                : String(attr.attribute_value || 'N/A')}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Specifications: Dimensions & Weight */}
                {(productWithFlash.width || productWithFlash.height || productWithFlash.depth || productWithFlash.weight) && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg sm:rounded-xl p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Dimensions & Weight</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {productWithFlash.width && (
                        <div>
                          <span className="text-xs text-gray-500">Width</span>
                          <p className="text-sm font-medium text-gray-700">{productWithFlash.width} cm</p>
                        </div>
                      )}
                      {productWithFlash.height && (
                        <div>
                          <span className="text-xs text-gray-500">Height</span>
                          <p className="text-sm font-medium text-gray-700">{productWithFlash.height} cm</p>
                        </div>
                      )}
                      {productWithFlash.depth && (
                        <div>
                          <span className="text-xs text-gray-500">Depth</span>
                          <p className="text-sm font-medium text-gray-700">{productWithFlash.depth} cm</p>
                        </div>
                      )}
                      {productWithFlash.weight && (
                        <div>
                          <span className="text-xs text-gray-500">Weight</span>
                          <p className="text-sm font-medium text-gray-700">{productWithFlash.weight} kg</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Condition, Warranty, Returns, Box Contents */}
                {(productWithFlash.condition || productWithFlash.warranty || productWithFlash.returns || productWithFlash.box_contents || productWithFlash.condition_notes) && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg sm:rounded-xl p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Product Information</h3>
                    <div className="space-y-3">
                      {productWithFlash.condition && (
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-gray-700">Condition:</span>
                          <p className="text-sm text-gray-600 mt-1">{productWithFlash.condition}</p>
                        </div>
                      )}
                      {productWithFlash.condition_notes && (
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-gray-700">Condition Notes:</span>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{productWithFlash.condition_notes}</p>
                        </div>
                      )}
                      {productWithFlash.warranty && (
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-gray-700">Warranty:</span>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{productWithFlash.warranty}</p>
                        </div>
                      )}
                      {productWithFlash.returns && (
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-gray-700">Returns Policy:</span>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{productWithFlash.returns}</p>
                        </div>
                      )}
                      {productWithFlash.box_contents && (
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-gray-700">Box Contents:</span>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{productWithFlash.box_contents}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Shipping & Delivery Information */}
                {(productWithFlash.shipping_charge_regular || productWithFlash.shipping_charge_same_day || productWithFlash.delivery_radius || productWithFlash.ready_in_minutes || productWithFlash.enable_pickup) && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg sm:rounded-xl p-4 sm:p-5">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Shipping & Delivery</h3>
                    <div className="space-y-2 text-sm">
                      {productWithFlash.shipping_charge_regular !== undefined && productWithFlash.shipping_charge_regular !== null && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">Regular Shipping:</span>
                          <span className="text-gray-600 font-medium">
                            {productWithFlash.shipping_charge_regular > 0 
                              ? formatPrice(productWithFlash.shipping_charge_regular) 
                              : 'Free'}
                          </span>
                        </div>
                      )}
                      {productWithFlash.shipping_charge_same_day !== undefined && productWithFlash.shipping_charge_same_day !== null && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">Same Day Delivery:</span>
                          <span className="text-gray-600 font-medium">
                            {productWithFlash.shipping_charge_same_day > 0 
                              ? formatPrice(productWithFlash.shipping_charge_same_day) 
                              : 'Free'}
                          </span>
                        </div>
                      )}
                      {productWithFlash.delivery_radius && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">Delivery Radius:</span>
                          <span className="text-gray-600">{productWithFlash.delivery_radius} km</span>
                        </div>
                      )}
                      {productWithFlash.ready_in_minutes && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">Ready In:</span>
                          <span className="text-gray-600">{productWithFlash.ready_in_minutes} minutes</span>
                        </div>
                      )}
                      {productWithFlash.enable_pickup && (
                        <div className="flex items-center gap-2">
                          <CheckIcon className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700">Pickup Available</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Daraz-Style Variant Selection */}
                {Object.keys(getVariantAttributes).length > 0 && (
                  <div className="space-y-4 sm:space-y-5">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">Select Variant</h3>
                    {Object.entries(getVariantAttributes).map(([attrName, values]) => {
                      // Skip if only one value
                      if (values.length <= 1) return null;

                      // Get quantity for each variant option
                      const getVariantQty = (value) => {
                        const matchingVariant = productWithFlash?.product_variants?.find(variant => {
                          const variantAttrs = {};
                          if (variant?.attributes && Array.isArray(variant.attributes)) {
                            variant.attributes.forEach(attr => {
                              if (attr.attribute_name === attrName && attr.attribute_value) {
                                const val = Array.isArray(attr.attribute_value) 
                                  ? attr.attribute_value.join(', ') 
                                  : String(attr.attribute_value);
                                variantAttrs[attrName] = val;
                              }
                            });
                          }
                          if (productWithFlash?.product_attributes && Array.isArray(productWithFlash.product_attributes)) {
                            productWithFlash.product_attributes
                              .filter(attr => attr.variant_id === variant.id && attr.attribute_name === attrName)
                              .forEach(attr => {
                                const val = Array.isArray(attr.attribute_value) 
                                  ? attr.attribute_value.join(', ') 
                                  : String(attr.attribute_value);
                                variantAttrs[attrName] = val;
                              });
                          }
                          return String(variantAttrs[attrName] || '').toLowerCase() === String(value).toLowerCase();
                        });
                        return matchingVariant ? (matchingVariant?.quantity ?? matchingVariant?.qty ?? 0) : 0;
                      };

                      // Check if this is a color attribute
                      const isColor = attrName.toLowerCase() === 'color';

                      return (
                        <div key={attrName} className="space-y-2 sm:space-y-3">
                          <label className="block text-sm sm:text-base font-semibold text-gray-900">
                            {attrName}:
                            {selectedAttributes[attrName] && (
                              <span className="ml-2 text-[#F24E2E] font-bold">({selectedAttributes[attrName]})</span>
                            )}
                          </label>
                          <div className="flex flex-wrap gap-2 sm:gap-3">
                            {values.map((value) => {
                              const isSelected = selectedAttributes[attrName] === value;
                              const variantQty = getVariantQty(value);
                              const isInStock = variantQty > 0;

                              return (
                                <motion.button
                                  key={value}
                                  onClick={() => handleAttributeSelect(attrName, value)}
                                  disabled={!isInStock}
                                  whileHover={isInStock ? { scale: 1.05 } : {}}
                                  whileTap={isInStock ? { scale: 0.95 } : {}}
                                  className={`
                                    relative px-3 sm:px-4 py-2 sm:py-2.5 border-2 rounded-lg sm:rounded-xl cursor-pointer touch-manipulation
                                    ${isColor 
                                      ? 'w-10 h-10 sm:w-12 sm:h-12 rounded-full p-0' 
                                      : 'min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm font-medium'
                                    }
                                    ${isSelected
                                      ? isColor
                                        ? "border-[#F24E2E] ring-2 sm:ring-4 ring-[#F24E2E]/30 scale-110"
                                        : "bg-[#F24E2E] text-white border-[#F24E2E]"
                                      : isInStock
                                        ? isColor
                                          ? "border-gray-300 hover:border-gray-400"
                                          : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                                        : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
                                    }
                                  `}
                                  style={isColor ? { backgroundColor: value } : {}}
                                  title={isColor ? value : `${value}${!isInStock ? ' (Out of Stock)' : ` (Qty: ${variantQty})`}`}
                                >
                                  {!isColor && (
                                    <>
                                      <span className="block">{value}</span>
                                      {variantQty > 0 && (
                                        <span className="text-[10px] text-gray-500 block mt-0.5">Qty: {variantQty}</span>
                                      )}
                                    </>
                                  )}
                                  {isSelected && !isColor && (
                                    <CheckIcon className="absolute -top-1 -right-1 w-4 h-4 bg-[#F24E2E] text-white rounded-full p-0.5" />
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Fallback to old variant selection if no variants */}
                {Object.keys(getVariantAttributes).length === 0 && (
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
                                w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 cursor-pointer touch-manipulation
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
                                px-3 sm:px-5 py-2 sm:py-2.5 border-2 rounded-lg sm:rounded-xl cursor-pointer min-w-[50px] sm:min-w-[60px] text-xs sm:text-sm font-medium touch-manipulation
                                ${size === s 
                                  ? "bg-[#F24E2E] text-white border-[#F24E2E]" 
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
                  </div>
                )}

                  {/* Quantity & Add to Cart - Daraz Style */}
                  <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                      <label className="text-xs sm:text-sm font-semibold text-gray-900">Quantity:</label>
                      <div className="flex items-center border-2 border-gray-300 rounded-lg sm:rounded-xl overflow-hidden bg-white">
                        <motion.button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          whileHover={quantity > 1 ? { backgroundColor: '#f3f4f6' } : {}}
                          whileTap={quantity > 1 ? { scale: 0.95 } : {}}
                          className={`px-3 sm:px-4 py-2 sm:py-3 text-lg sm:text-xl font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer touch-manipulation ${
                            quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          −
                        </motion.button>
                        <input
                          type="number"
                          value={quantity}
                          onChange={handleQuantityChange}
                          min="1"
                          max={currentQuantity}
                          className="w-12 sm:w-16 h-full text-center border-x-2 border-gray-300 appearance-none text-base sm:text-lg font-semibold [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:outline-none"
                        />
                        <motion.button
                          onClick={() => {
                            const maxQty = Math.min(currentQuantity, quantity + 1);
                            setQuantity(maxQty);
                          }}
                          disabled={quantity >= currentQuantity}
                          whileHover={quantity < currentQuantity ? { backgroundColor: '#f3f4f6' } : {}}
                          whileTap={quantity < currentQuantity ? { scale: 0.95 } : {}}
                          className={`px-3 sm:px-4 py-2 sm:py-3 text-lg sm:text-xl font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer touch-manipulation ${
                            quantity >= currentQuantity ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          +
                        </motion.button>
                      </div>
                      {currentQuantity > 0 && (
                        <span className="text-xs sm:text-sm text-gray-600">
                          (Max: {currentQuantity})
                        </span>
                      )}
                    </div>
                    <motion.button
                      onClick={handleAddToCart}
                      disabled={currentQuantity === 0 || quantity > currentQuantity}
                      whileHover={currentQuantity > 0 && quantity <= currentQuantity ? { scale: 1.02 } : {}}
                      whileTap={currentQuantity > 0 && quantity <= currentQuantity ? { scale: 0.98 } : {}}
                      className={`w-full bg-gradient-to-r from-[#F24E2E] to-orange-500 hover:from-[#e03e1e] hover:to-orange-600 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl text-base sm:text-lg flex items-center justify-center gap-2 touch-manipulation ${
                        currentQuantity === 0 || quantity > currentQuantity ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {currentQuantity === 0 ? 'Out of Stock' : quantity > currentQuantity ? 'Quantity Exceeds Stock' : t('product.addToCart')}
                    </motion.button>
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
                          {(() => {
                            const storeRating = Number(
                              vendorData?.data?.bayesian_rating ?? 
                              vendorData?.data?.average_review_rating ?? 
                              productWithFlash?.store?.rating ?? 
                              productWithFlash?.seller?.rating ?? 
                              0
                            );
                            return [...Array(5)].map((_, i) => {
                              const starValue = i + 1;
                              const isFilled = starValue <= storeRating;
                              const isHalfFilled = starValue > storeRating && starValue - 0.5 <= storeRating;
                              return (
                                <div key={i} className="relative w-3.5 h-3.5 sm:w-4 sm:h-4">
                                  {/* Background star (always gray) */}
                                  <svg 
                                    className="absolute top-0 left-0 w-full h-full text-gray-300" 
                                    fill="currentColor" 
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
                                  </svg>
                                  {/* Filled star (yellow) */}
                                  {(isFilled || isHalfFilled) && (
                                    <div 
                                      className="absolute top-0 left-0 overflow-hidden"
                                      style={{ width: isFilled ? '100%' : '50%' }}
                                    >
                                      <svg 
                                        className="w-full h-full text-yellow-400"
                                        fill="currentColor" 
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.357 2.44a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.357-2.44a1 1 0 00-1.175 0l-3.357 2.44c-.784.57-1.838-.197-1.54-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.314 9.397c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.97z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          {Number(
                            vendorData?.data?.bayesian_rating ?? 
                            vendorData?.data?.average_review_rating ?? 
                            productWithFlash?.store?.rating ?? 
                            productWithFlash?.seller?.rating ?? 
                            0
                          ).toFixed(1)}
                          {vendorData?.data?.review_count > 0 && (
                            <span className="ml-1">({vendorData.data.review_count})</span>
                          )}
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
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 font-medium touch-manipulation"
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
                      {/* Returns Policy - Dynamic */}
                      <div className="flex gap-2 sm:gap-3 items-start">
                        <div className="bg-green-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                          <ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-900">
                            {productWithFlash?.returns && productWithFlash.returns.trim()
                              ? (productWithFlash.returns.length > 50 
                                  ? productWithFlash.returns.substring(0, 50).trim() + '...' 
                                  : productWithFlash.returns.trim())
                              : 'Returns Available'}
                          </h4>
                          <p className="text-[10px] sm:text-xs text-gray-600 line-clamp-2">
                            {productWithFlash?.returns && productWithFlash.returns.trim()
                              ? (productWithFlash.returns.length > 100 
                                  ? productWithFlash.returns.substring(0, 100).trim() + '...' 
                                  : productWithFlash.returns.trim())
                              : 'Return policy available. Contact seller for details.'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Warranty/Guarantee - Dynamic */}
                      <div className="flex gap-2 sm:gap-3 items-start">
                        <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                          <ShieldCheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-900">
                            {productWithFlash?.warranty && productWithFlash.warranty.trim()
                              ? (productWithFlash.warranty.length > 50 
                                  ? productWithFlash.warranty.substring(0, 50).trim() + '...' 
                                  : productWithFlash.warranty.trim())
                              : 'Warranty & Support'}
                          </h4>
                          <p className="text-[10px] sm:text-xs text-gray-600 line-clamp-2">
                            {productWithFlash?.warranty && productWithFlash.warranty.trim()
                              ? (productWithFlash.warranty.length > 100 
                                  ? productWithFlash.warranty.substring(0, 100).trim() + '...' 
                                  : productWithFlash.warranty.trim())
                              : 'Warranty information available. Contact seller for details.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Product Variants Section - Daraz/Shopify Style */}
          {productWithFlash?.product_variants && Array.isArray(productWithFlash.product_variants) && productWithFlash.product_variants.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4 sm:mt-6 lg:mt-8 bg-white rounded-3xl overflow-hidden"
            >
              <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-200">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#F24E2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  All Variants ({productWithFlash.product_variants.length})
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mt-2">Choose from available product variants</p>
              </div>

              <div className="p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {productWithFlash.product_variants.map((variant, index) => {
                    const variantImageUrl = variant?.image ? buildImageUrl(variant.image) : mainImageUrl;
                    const variantPrice = variant?.price_tax_excl || variant?.price || 0;
                    const variantComparedPrice = variant?.compared_price || 0;
                    const variantDiscount = variantComparedPrice > variantPrice
                      ? Math.round(((variantComparedPrice - variantPrice) / variantComparedPrice) * 100)
                      : 0;
                    
                    // Determine stock status: in stock if quantity > 0 OR in_stock is true
                    const variantQuantity = variant?.quantity ?? variant?.qty ?? 0;
                    const isVariantInStock = variantQuantity > 0 || variant?.in_stock === true;

                    // Get variant attributes as key-value pairs
                    const variantAttributes = {};
                    if (variant?.attributes && Array.isArray(variant.attributes)) {
                      variant.attributes.forEach(attr => {
                        if (attr.attribute_name && attr.attribute_value) {
                          variantAttributes[attr.attribute_name] = attr.attribute_value;
                        }
                      });
                    }

                    // Also check product_attributes for this variant
                    if (productWithFlash?.product_attributes && Array.isArray(productWithFlash.product_attributes)) {
                      productWithFlash.product_attributes
                        .filter(attr => attr.variant_id === variant.id)
                        .forEach(attr => {
                          if (attr.attribute_name && attr.attribute_value) {
                            variantAttributes[attr.attribute_name] = attr.attribute_value;
                          }
                        });
                    }

                    const isSelected = selectedVariant?.id === variant.id;

                    return (
                      <motion.div
                        key={variant.id || index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        onClick={() => setSelectedVariant(variant)}
                        className={`relative bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden border-2 cursor-pointer ${
                          isSelected 
                            ? 'border-[#F24E2E] ring-4 ring-[#F24E2E]/30 scale-105' 
                            : 'border-gray-200 hover:border-[#F24E2E]/50'
                        }`}
                      >
                        {/* Selected Badge */}
                        {isSelected && (
                          <div className="absolute top-3 left-3 z-20 bg-[#F24E2E] text-white px-4 py-2 rounded-full text-xs font-extrabold border-2 border-white/50 flex items-center gap-1">
                            <CheckIcon className="w-4 h-4" />
                            Selected
                          </div>
                        )}

                        {/* Discount Badge */}
                        {variantDiscount > 0 && !isSelected && (
                          <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            -{variantDiscount}%
                          </div>
                        )}

                        {/* Stock Badge */}
                        {isVariantInStock ? (
                          <div className="absolute top-3 right-3 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            In Stock
                          </div>
                        ) : (
                          <div className="absolute top-3 right-3 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            Out of Stock
                          </div>
                        )}

                        {/* Variant Image */}
                        <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 p-4 sm:p-6 flex items-center justify-center overflow-hidden">
                          <motion.img
                            src={variantImageUrl}
                            alt={variant?.name || productWithFlash.name}
                            className="max-w-full max-h-full w-auto h-auto object-contain"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          />
                        </div>

                        {/* Variant Info */}
                        <div className="p-4 sm:p-5 space-y-3">
                          {/* Variant Name */}
                          {variant?.name && (
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-2">
                              {variant.name}
                            </h3>
                          )}

                          {/* Variant SKU */}
                          {variant?.sku && (
                            <p className="text-xs text-gray-500">
                              SKU: <span className="font-medium">{variant.sku}</span>
                            </p>
                          )}

                          {/* Variant Attributes */}
                          {Object.keys(variantAttributes).length > 0 && (
                            <div className="space-y-2">
                              {Object.entries(variantAttributes).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-700 capitalize min-w-[80px]">
                                    {key}:
                                  </span>
                                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Variant Price */}
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-xl sm:text-2xl font-bold text-[#F24E2E]">
                                {formatPrice(variantPrice)}
                              </span>
                              {variantComparedPrice > variantPrice && (
                                <>
                                  <span className="text-sm text-gray-400 line-through">
                                    {formatPrice(variantComparedPrice)}
                                  </span>
                                  <span className="text-xs text-green-600 font-semibold">
                                    Save {formatPrice(variantComparedPrice - variantPrice)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Stock Info */}
                          <div className="flex items-center justify-between text-xs mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isVariantInStock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className={isVariantInStock ? 'text-green-600' : 'text-red-600'}>
                                {isVariantInStock ? 'Available' : 'Out of Stock'}
                              </span>
                            </div>
                            {(variantQuantity > 0 || variantQuantity === 0) && (
                              <span className="text-gray-500">
                                Qty: <span className="font-semibold">{variantQuantity}</span>
                              </span>
                            )}
                          </div>

                          {/* Add to Cart Button for Variant */}
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVariant(variant);
                              // Use variant price
                              const variantPrice = variant?.price_tax_excl || variant?.price || 0;
                              
                              // Extract store information
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
                                price: variantPrice,
                                quantity: 1,
                                variant_id: variant.id,
                                variant: variant,
                                ...(storeInfo && { store: storeInfo }),
                                ...(productWithFlash.store_id && { storeId: productWithFlash.store_id }),
                                ...(storeInfo?.id && { storeId: storeInfo.id }),
                                ...(productWithFlash.shipping_charge_regular && { shipping_charge_regular: productWithFlash.shipping_charge_regular }),
                                ...(productWithFlash.shipping_charge_same_day && { shipping_charge_same_day: productWithFlash.shipping_charge_same_day }),
                              };

                              console.log("Dispatching addItem with variant payload:", payload);
                              dispatch(addItem(payload));
                              setShowSuccessMessage(true);
                              setTimeout(() => setShowSuccessMessage(false), 3000);
                            }}
                            disabled={!isVariantInStock}
                            whileHover={{ scale: isVariantInStock ? 1.02 : 1 }}
                            whileTap={{ scale: isVariantInStock ? 0.98 : 1 }}
                            className={`w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                              isVariantInStock
                                ? 'bg-[#F24E2E] hover:bg-[#e03e1e] text-white shadow-lg hover:shadow-xl'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {isVariantInStock ? 'Add to Cart' : 'Out of Stock'}
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Variant Details Section */}
              {selectedVariant && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 sm:mt-8 bg-gradient-to-br from-[#F24E2E]/10 via-orange-500/10 to-pink-500/10 rounded-3xl p-6 sm:p-8 border-2 border-[#F24E2E]/30 shadow-xl"
                >
                  <div className="flex items-start gap-4 sm:gap-6">
                    {/* Selected Variant Image */}
                    <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-3 border-[#F24E2E] bg-white p-3 shadow-lg">
                      <img
                        src={selectedVariant?.image ? buildImageUrl(selectedVariant.image) : mainImageUrl}
                        alt={selectedVariant?.name || 'Selected variant'}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    {/* Selected Variant Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <CheckIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#F24E2E] flex-shrink-0" />
                        <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                          Selected Variant: {selectedVariant?.name || 'Variant'}
                        </h3>
                      </div>
                      
                      <div className="space-y-3 sm:space-y-4">
                        {/* Price */}
                        {(selectedVariant?.price_tax_excl || selectedVariant?.price) && (
                        <div className="flex items-baseline gap-4 flex-wrap">
                          <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#F24E2E] to-orange-500 bg-clip-text text-transparent">
                            {formatPrice(selectedVariant?.price_tax_excl || selectedVariant?.price)}
                          </span>
                          {selectedVariant?.compared_price && selectedVariant.compared_price > (selectedVariant.price_tax_excl || selectedVariant.price || 0) && (
                            <>
                              <span className="text-lg text-gray-400 line-through font-medium">
                                {formatPrice(selectedVariant.compared_price)}
                              </span>
                              <span className="text-sm text-green-600 font-bold bg-green-50 px-3 py-1 rounded-lg">
                                Save {formatPrice(selectedVariant.compared_price - (selectedVariant.price_tax_excl || selectedVariant.price || 0))}
                              </span>
                            </>
                          )}
                        </div>
                        )}
                        
                        {/* SKU */}
                        {selectedVariant?.sku && (
                          <div className="bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-[#F24E2E]/20">
                            <span className="text-sm font-bold text-gray-700">SKU:</span> 
                            <span className="text-sm text-gray-800 font-semibold ml-2">{selectedVariant.sku}</span>
                          </div>
                        )}
                        
                        {/* Variant Attributes */}
                        {(() => {
                          const selectedVariantAttributes = {};
                          if (selectedVariant?.attributes && Array.isArray(selectedVariant.attributes)) {
                            selectedVariant.attributes.forEach(attr => {
                              if (attr.attribute_name && attr.attribute_value) {
                                selectedVariantAttributes[attr.attribute_name] = attr.attribute_value;
                              }
                            });
                          }
                          if (productWithFlash?.product_attributes && Array.isArray(productWithFlash.product_attributes)) {
                            productWithFlash.product_attributes
                              .filter(attr => attr.variant_id === selectedVariant.id)
                              .forEach(attr => {
                                if (attr.attribute_name && attr.attribute_value) {
                                  selectedVariantAttributes[attr.attribute_name] = attr.attribute_value;
                                }
                              });
                          }
                          
                          if (Object.keys(selectedVariantAttributes).length === 0) return null;
                          
                          return (
                            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-[#F24E2E]/20">
                              <h4 className="text-sm font-bold text-gray-900 mb-3">Specifications:</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(selectedVariantAttributes).map(([key, value]) => (
                                  <div key={key} className="flex items-center gap-2">
                                    <span className="text-xs sm:text-sm font-bold text-gray-700 capitalize min-w-[100px]">
                                      {key}:
                                    </span>
                                    <span className="text-xs sm:text-sm text-gray-800 font-semibold">
                                      {Array.isArray(value) ? value.join(', ') : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* Stock Status */}
                        <div className="flex items-center gap-4 flex-wrap">
                          {(() => {
                            const selectedVariantQty = selectedVariant?.quantity ?? selectedVariant?.qty ?? 0;
                            const isSelectedInStock = selectedVariantQty > 0 || selectedVariant?.in_stock === true;
                            return (
                              <>
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${isSelectedInStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  <div className={`w-3 h-3 rounded-full ${isSelectedInStock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  <span className="text-sm">
                                    {isSelectedInStock ? 'In Stock' : 'Out of Stock'}
                                  </span>
                                </div>
                                <div className="bg-gray-100 px-4 py-2 rounded-xl">
                                  <span className="text-sm font-bold text-gray-700">Available Quantity:</span>
                                  <span className="text-sm text-gray-800 font-bold ml-2">{selectedVariantQty} units</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Reviews Section */}
          <div className="mt-4 sm:mt-6 lg:mt-8">
            <ReviewSlider productId={productWithFlash.id} />
          </div>
        </div>
      </div>
    </SharedLayout>
  );
}

