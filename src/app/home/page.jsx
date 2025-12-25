//src/app/home/page.jsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import BannerSlider from "@/components/BannerSlider";
import BestSellingProduct from "@/components/BestSellingProduct";
import CategoryNav from "@/components/CategoryNav";
import FilterNav from "@/components/FilterNav";
import ProductSlider from "@/components/ProductSlider";
import StoreNearYou from '@/components/StoreNearYou';
import { useGetRequest } from '@/controller/getRequests';
import { getLatLngFromPostcode } from '@/controller/getLatLngFromPostcode';
import SingleBannerSlider from "@/components/SingleBannerSlider";
import PushOptIn from "@/components/PushOptIn";
import PersonalizedFeed from "@/components/PersonalizedFeed";
import { useI18n } from '@/contexts/I18nContext';

export default function HomePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const { token } = useSelector((state) => state.auth);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Redux: Delivery / Pickup mode
  const deliveryMode = useSelector((state) => state.delivery.mode);

  const {
    data: products,
    error: productsError,
    loading: productsLoading,
    sendGetRequest: getProducts
  } = useGetRequest();

  const {
    data: stores,
    error: storesError,
    loading: storesLoading,
    sendGetRequest: getStores
  } = useGetRequest();

  const {
    data: flash,
    error: flashError,
    loading: flashLoading,
    sendGetRequest: getFlash
  } = useGetRequest();

  const handleProductView = (product) => {
    try {
      // Only save recently viewed if user is logged in
      if (!token) {
        console.log('🔒 User not logged in, skipping recently viewed save');
        return;
      }

      if (!product || !product.id) {
        console.warn('⚠️ handleProductView called with invalid product:', product);
        return;
      }
      
      console.log('✅ Saving recently viewed product:', product.id, product.name);
      
      const key = 'recentlyViewedProductIds';
      const dataKey = 'recentlyViewedProductsData';
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      const rawData = typeof window !== 'undefined' ? localStorage.getItem(dataKey) : null;
      
      let ids = raw ? JSON.parse(raw) : [];
      let productsData = rawData ? JSON.parse(rawData) : [];
      
      if (!Array.isArray(ids)) ids = [];
      if (!Array.isArray(productsData)) productsData = [];
      
      const idStr = String(product.id);
      
      // Remove existing entry
      ids = ids.filter((x) => String(x) !== idStr);
      productsData = productsData.filter((p) => String(p?.id) !== idStr);
      
      // Add to beginning
      ids.unshift(idStr);
      productsData.unshift(product);
      
      // Keep only last 20
      ids = ids.slice(0, 20);
      productsData = productsData.slice(0, 20);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(ids));
        localStorage.setItem(dataKey, JSON.stringify(productsData));
        console.log('💾 Saved to localStorage:', ids.length, 'product IDs');
      }
      
      // Update state immediately
      setRecentlyViewed((prev) => {
        const filtered = (prev || []).filter((p) => String(p?.id) !== idStr);
        const updated = [product, ...filtered].slice(0, 12);
        console.log('🔄 Updated recently viewed state:', updated.length, 'products');
        return updated;
      });
    } catch (error) {
      console.error('❌ Error saving recently viewed product:', error);
    }
  };

  // Helper function to get lat/lng from postcode using Google Maps API

  useEffect(() => {
    async function fetchProducts() {
      // let lat = 31.66433403582844;
      // let lng = 73.29104236281667;
      let lat = localStorage.getItem("lat");
      let lng = localStorage.getItem("lng");
      
      // Convert to numbers if they exist
      if (lat) lat = parseFloat(lat);
      if (lng) lng = parseFloat(lng);
      let price = localStorage.getItem("selectedPrice");
      const fee = localStorage.getItem('deliveryFee');
      const rating = localStorage.getItem('selectedRating');
      const sort = localStorage.getItem('selectedSortOption');
      const offersOnly = (localStorage.getItem('offersOnly') === 'true') || offersParam;
      const maxEtaMinutes = localStorage.getItem('maxEtaMinutes');
      const categoryId = localStorage.getItem('selectedCategoryId');

      // fallback: derive from postcode if missing
      if ((!lat || !lng) && localStorage.getItem("postcode")) {
        const postcode = localStorage.getItem("postcode");
        console.log(postcode, 'postcode from localstorage....');
        const coords = await getLatLngFromPostcode(postcode, "UK");
        console.log(coords, 'coords from home page with API')
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
          localStorage.setItem("lat", lat);
          localStorage.setItem("lng", lng);
        }
      }

      // Check if user has explicitly set their location
      const userHasExplicitLocation = localStorage.getItem('userLocationSet') === 'true';
      
      // If still no location OR user hasn't explicitly set it, use admin default location
      if (!lat || !lng || !userHasExplicitLocation) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const response = await fetch(`${apiUrl}/api/default-location`);
          if (response.ok) {
            const data = await response.json();
            if (data.status === 200 && data.data) {
              const defaultLat = parseFloat(data.data.default_location_latitude);
              const defaultLng = parseFloat(data.data.default_location_longitude);
              
              // Use admin default location
              lat = defaultLat;
              lng = defaultLng;
              
              console.log('✅ Using admin default location:', { 
                lat, 
                lng,
                hadPreviousLocation: !!(lat && lng),
                userExplicitlySet: userHasExplicitLocation
              });
              
              // Store in localStorage for future use (as strings for consistency)
              localStorage.setItem("lat", lat.toString());
              localStorage.setItem("lng", lng.toString());
            }
          }
        } catch (error) {
          console.error('Error fetching default location:', error);
        }
      } else {
        // Ensure coordinates are numbers, not strings
        lat = parseFloat(lat);
        lng = parseFloat(lng);
        console.log('📍 Using user-set location:', { lat, lng });
      }

      // API selection logic based on delivery mode
      // build base URL
      const modeParam = `mode=${deliveryMode}`;
      let url = "";

      // Get city name for products API (same logic as stores)
      let cityName = localStorage.getItem('city');
      if (!cityName) {
        const postcode = localStorage.getItem('postcode');
        if (postcode) {
          const postalCodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
          if (!postalCodePattern.test(postcode.trim())) {
            const parts = postcode.split(',');
            cityName = parts[0].trim();
          }
        }
      }
      
      // Always use location-based endpoint if we have coordinates (user or admin default)
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        url = `/products/getNearbyProducts?lat=${lat}&lng=${lng}&${modeParam}`;
        // Don't add city parameter when we have coordinates - use radius-based filtering only
        // City filtering can exclude products from stores that are within radius but have different city names
      } else {
        // Fallback to getAllProducts if no location available at all
        url = `/products/getAllProducts?${modeParam}`;
        // Only use city parameter if we don't have coordinates
        if (cityName) {
          url += `&city=${encodeURIComponent(cityName)}`;
        }
      }

      // 👇 append filters if selected
      if (price && price !== "6") {
        url += `&max_price=${price * 10}`; // example mapping (£10, £20, etc.)
      }
      if (fee && fee !== '6') {
        url += `&max_delivery_fee=${fee}`;
      }
      if (rating) {
        url += `&min_rating=${rating}`;
      }
      // Note: backend products table does not have a 'rating' column,
      // so we only apply rating filter on the client side (see below).
      if (offersOnly) {
        url += `&has_offers=true`;
      }
      if (maxEtaMinutes) {
        url += `&max_eta=${maxEtaMinutes}`;
      }
      if (categoryId) {
        url += `&category_id=${categoryId}`;
      }
      if (sort) {
        // Map UI labels to API keys as needed
        const sortMap = {
          'Recommended': 'recommended',
          'Rating': 'rating_desc',
          'Earliest arrival': 'eta_asc',
        };
        const sortKey = sortMap[sort] || 'recommended';
        url += `&sort=${sortKey}`;
      }

      if (typeof window !== 'undefined') {
        console.log('[Home] fetching products URL:', url);
      }
      await getProducts(url);
      await getFlash('/flash-sales/active');
    }

    // Separate function to fetch stores
    // Stores can be filtered by their products' average rating (matching product filter)
    async function fetchStores() {
      let lat = localStorage.getItem("lat");
      let lng = localStorage.getItem("lng");
      
      // Convert to numbers if they exist
      if (lat) lat = parseFloat(lat);
      if (lng) lng = parseFloat(lng);

      // Get rating filter to apply to stores (filter stores by their products' average rating)
      const rating = localStorage.getItem('selectedRating');
      const postcode = localStorage.getItem('postcode');

      const modeParam = `mode=${deliveryMode}`;
      let storesUrl = `/stores/getAllStores?${modeParam}`;
      
      // Check if postcode is a valid UK postcode format
      const postalCodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
      const isPostcode = postcode && postalCodePattern.test(postcode.trim());
      
      // If we have coordinates, use them for filtering
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        storesUrl += `&lat=${lat}&lng=${lng}`;
        // If it's a postcode, also send it for exact matching and use smaller radius
        if (isPostcode) {
          storesUrl += `&postcode=${encodeURIComponent(postcode.trim())}`;
          storesUrl += `&radius=2`; // Use smaller radius (2km) for postcode searches
        }
      } else {
        // Only use city/postcode filtering if we don't have coordinates
        if (isPostcode) {
          // Send postcode for exact matching
          storesUrl += `&postcode=${encodeURIComponent(postcode.trim())}`;
        } else {
          // Use city filtering for non-postcode entries
          let cityName = localStorage.getItem('city');
          if (!cityName && postcode) {
            const parts = postcode.split(',');
            cityName = parts[0].trim();
          }
          if (cityName) {
            storesUrl += `&city=${encodeURIComponent(cityName)}`;
          }
        }
      }
      
      // Add rating filter to stores URL - stores will be filtered by their products' average rating
      if (rating) {
        storesUrl += `&min_rating=${rating}`;
      }
      
      await getStores(storesUrl);
    }

    // Initial load - fetch both products and stores
    fetchProducts();
    fetchStores();

    // 👇 Listen for filter events
    // NOTE: Rating filter affects both products AND stores (stores filtered by their products' average rating)
    // Other product filters (price, offers, etc.) only affect products, NOT stores
    const handlePriceFilter = () => fetchProducts(); // Only fetch products, not stores
    const handleDeliveryFee = () => fetchProducts(); // Only fetch products, not stores
    const handleRating = () => {
      fetchProducts(); // Fetch products with rating filter
      fetchStores(); // Also fetch stores filtered by their products' average rating
    };
    const handleSort = () => fetchProducts(); // Only fetch products, not stores
    const handleOffers = () => fetchProducts(); // Only fetch products, not stores
    const handleTime = () => fetchProducts(); // Only fetch products, not stores
    const handleClearAll = () => {
      fetchProducts(); // Fetch products without filters
      fetchStores(); // Also refetch stores without rating filter
    };
    const handleCategory = () => {
      // Redirect to products page when category is selected
      router.push('/products');
    };
    const handleLocationUpdate = () => {
      // Refetch products and stores when location is updated (e.g., default location set)
      console.log('📍 Location updated, refetching products and stores...');
      fetchProducts();
      fetchStores(); // Also refetch stores when location changes
    };

    window.addEventListener("priceFilterApplied", handlePriceFilter);
    window.addEventListener("deliveryFeeApplied", handleDeliveryFee);
    window.addEventListener("ratingFilterApplied", handleRating);
    window.addEventListener("sortApplied", handleSort);
    window.addEventListener("offersToggled", handleOffers);
    window.addEventListener("timeFilterApplied", handleTime);
    window.addEventListener("filtersCleared", handleClearAll);
    window.addEventListener("categorySelected", handleCategory);
    window.addEventListener("locationUpdated", handleLocationUpdate);
    return () => {
      window.removeEventListener("priceFilterApplied", handlePriceFilter);
      window.removeEventListener("deliveryFeeApplied", handleDeliveryFee);
      window.removeEventListener("ratingFilterApplied", handleRating);
      window.removeEventListener("sortApplied", handleSort);
      window.removeEventListener("offersToggled", handleOffers);
      window.removeEventListener("timeFilterApplied", handleTime);
      window.removeEventListener("filtersCleared", handleClearAll);
      window.removeEventListener("categorySelected", handleCategory);
      window.removeEventListener("locationUpdated", handleLocationUpdate);
    };
  }, [deliveryMode]); // dependency remains same

  // Mark initial load as complete once products are loaded
  useEffect(() => {
    if (isInitialLoad && !productsLoading && !storesLoading && products?.data) {
      setIsInitialLoad(false);
    }
  }, [productsLoading, storesLoading, products, isInitialLoad]);

  // Use empty array during initial load, otherwise use products/stores data
  const allProducts = useMemo(() => {
    return (isInitialLoad && productsLoading) ? [] : (products?.data || []);
  }, [products?.data, isInitialLoad, productsLoading]);
  const allStores = useMemo(() => {
    return (isInitialLoad && storesLoading) ? [] : (stores?.data || []);
  }, [stores?.data, isInitialLoad, storesLoading]);

  // Function to load recently viewed products
  const loadRecentlyViewed = useCallback(() => {
    // Only load recently viewed if user is logged in
    if (!token) {
      console.log('🔒 User not logged in, clearing recently viewed');
      setRecentlyViewed([]);
      return;
    }

    try {
      if (typeof window === 'undefined') return;
      
      // Debug: Check all localStorage keys
      console.log('🔍 Checking localStorage for recently viewed...');
      const allKeys = Object.keys(localStorage);
      const relevantKeys = allKeys.filter(k => k.toLowerCase().includes('recent') || k.toLowerCase().includes('viewed'));
      console.log('🔍 Relevant localStorage keys:', relevantKeys);
      
      // First, try to load from stored product data (faster, works even if products haven't loaded)
      const dataKey = 'recentlyViewedProductsData';
      const rawData = localStorage.getItem(dataKey);
      
      console.log('🔍 Raw data from localStorage:', rawData ? `Found ${rawData.length} chars` : 'null');
      
      if (rawData) {
        try {
          const storedProducts = JSON.parse(rawData);
          console.log('🔍 Parsed products:', Array.isArray(storedProducts) ? storedProducts.length : 'not an array');
          
          if (Array.isArray(storedProducts) && storedProducts.length > 0) {
            // Filter out any invalid products
            const validProducts = storedProducts.filter(p => p && p.id && p.name);
            console.log('🔍 Valid products after filtering:', validProducts.length);
            
            if (validProducts.length > 0) {
              // Filter by location: only include products that are available in the user's selected location
              // allProducts is already filtered by location, so we check if stored products exist in allProducts
              // IMPORTANT: Only show recently viewed if allProducts is loaded (has location-filtered products)
              if (allProducts.length > 0) {
                // Create a map of available product IDs for quick lookup
                const availableProductIds = new Set(allProducts.map(p => String(p?.id)));
                
                // Filter to only include products that are available in the current location
                const locationFilteredProducts = validProducts.filter(p => 
                  availableProductIds.has(String(p?.id))
                );
                
                console.log('📍 Location filtering:', {
                  before: validProducts.length,
                  after: locationFilteredProducts.length,
                  availableProducts: allProducts.length
                });
                
                if (locationFilteredProducts.length > 0) {
                  console.log('📦 Loading recently viewed from stored data (location filtered):', locationFilteredProducts.length, 'products');
                  console.log('📦 Sample product:', locationFilteredProducts[0]?.name, locationFilteredProducts[0]?.id);
                  setRecentlyViewed(locationFilteredProducts.slice(0, 12));
                  return; // Use stored data if available
                } else {
                  console.log('📍 No recently viewed products available in selected location');
                  setRecentlyViewed([]); // Clear if no products match location
                  return;
                }
              } else {
                console.log('⏳ Products not loaded yet, waiting for products to load before showing recently viewed');
                // Don't show recently viewed until products are loaded (so we can filter by location)
                setRecentlyViewed([]);
                return;
              }
            } else {
              console.warn('⚠️ Stored products found but none are valid');
              console.warn('⚠️ Sample stored product:', storedProducts[0]);
            }
          } else {
            console.warn('⚠️ Stored data is not an array or is empty');
          }
        } catch (e) {
          console.error('❌ Error parsing stored products data:', e);
          console.error('❌ Raw data (first 200 chars):', rawData.substring(0, 200));
        }
      } else {
        console.log('📦 No stored products data found in localStorage');
      }
      
      // Fallback: try to match IDs with loaded products
      const key = 'recentlyViewedProductIds';
      const raw = localStorage.getItem(key);
      const ids = raw ? JSON.parse(raw) : [];
      
      console.log('📦 Recently viewed IDs from localStorage:', ids.length);
      console.log('📦 All products available:', allProducts.length);
      
      if (Array.isArray(ids) && ids.length > 0) {
        if (allProducts.length > 0) {
          const map = new Map(allProducts.map((p) => [String(p?.id), p]));
          const items = ids.map((id) => map.get(String(id))).filter(Boolean);
          console.log('📦 Matched products (fallback):', items.length);
          if (items.length > 0) {
            setRecentlyViewed(items.slice(0, 12));
          } else {
            console.log('📍 No recently viewed products available in selected location (fallback)');
            setRecentlyViewed([]); // Clear if no products match location
          }
        } else {
          console.log('⏳ Products not loaded yet, clearing recently viewed until products load');
          setRecentlyViewed([]); // Clear until products are loaded so we can filter by location
        }
      } else {
        // Clear if no IDs in localStorage
        console.log('📦 No recently viewed products found');
        setRecentlyViewed([]);
      }
    } catch (error) {
      console.error('❌ Error loading recently viewed:', error);
      setRecentlyViewed([]);
    }
  }, [token, allProducts]);

  useEffect(() => {
    loadRecentlyViewed();
  }, [loadRecentlyViewed]);

  // Debug: Log when recentlyViewed state changes
  useEffect(() => {
    console.log('🔍 Recently viewed state updated:', recentlyViewed.length, 'products');
    if (recentlyViewed.length > 0) {
      console.log('🔍 Sample product:', recentlyViewed[0]?.name, recentlyViewed[0]?.id);
    }
  }, [recentlyViewed]);

  // Debug: Test localStorage access on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Test if we can read/write to localStorage
      try {
        const testKey = 'test_recently_viewed';
        localStorage.setItem(testKey, 'test');
        const testValue = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        console.log('✅ localStorage is accessible:', testValue === 'test');
        
        // Check what's actually in localStorage
        const allKeys = Object.keys(localStorage);
        console.log('🔍 All localStorage keys:', allKeys.length, 'keys');
        const recentKeys = allKeys.filter(k => k.toLowerCase().includes('recent') || k.toLowerCase().includes('viewed'));
        if (recentKeys.length > 0) {
          console.log('🔍 Found recent/viewed keys:', recentKeys);
          recentKeys.forEach(key => {
            const value = localStorage.getItem(key);
            console.log(`🔍 ${key}:`, value ? `${value.length} chars` : 'null');
          });
        }
      } catch (e) {
        console.error('❌ localStorage access error:', e);
      }
    }
  }, []);

  // Reload recently viewed when page becomes visible (user returns from product page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Page visible, reloading recently viewed...');
        loadRecentlyViewed();
      }
    };

    const handleFocus = () => {
      console.log('🎯 Window focused, reloading recently viewed...');
      loadRecentlyViewed();
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [loadRecentlyViewed]);

  // Merge flash sale prices and end dates if available
  const flashProducts = (flash?.data?.products || []).reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});
  const productsWithFlash = allProducts.map((p) => {
    const fp = flashProducts[p.id];
    if (fp) {
      return { 
        ...p, 
        flash_price: fp.flash_price || fp.pivot?.price,
        flash_sale_end_date: fp.pivot?.end_date || fp.end_date,
      };
    }
    return p;
  });

  // Helper to compute discount meta for a product
  const computeDiscountMeta = (p) => {
    const basePrice = Number(p?.price_tax_excl ?? p?.price ?? p?.unit_price ?? 0) || 0;
    const comparePriceRaw = p?.compared_price ?? basePrice;
    const comparePrice = Number(comparePriceRaw) || basePrice || 0;
    const hasFlash = p?.flash_price != null;
    const flashPrice = hasFlash ? Number(p.flash_price) : null;
    const effectivePrice = Number.isFinite(flashPrice) && flashPrice !== null ? flashPrice : basePrice;

    const explicitDiscount = Number(p?.discount || 0);
    const hasOfferFlag = Boolean(p?.has_offer);

    const priceDiscount = comparePrice > 0 && effectivePrice > 0 && comparePrice > effectivePrice;
    const percentFromPrice = priceDiscount
      ? Math.round(((comparePrice - effectivePrice) / comparePrice) * 100)
      : 0;

    const percent = explicitDiscount || percentFromPrice;
    const hasDiscount = Boolean(
      (percent && percent > 0) ||
      priceDiscount ||
      hasOfferFlag ||
      (hasFlash && basePrice > 0 && flashPrice < basePrice)
    );

    return {
      hasDiscount,
      percent: percent > 0 ? percent : 0,
      effectivePrice,
      comparePrice,
    };
  };

  // Build discount campaign banners from discounted products
  const discountBannerItems = useMemo(() => {
    if (!Array.isArray(productsWithFlash) || productsWithFlash.length === 0) return [];

    const discounted = productsWithFlash.filter((p) => computeDiscountMeta(p).hasDiscount);
    if (!discounted.length) return [];

    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const toAbsolute = (img) => {
      if (!img) return '';
      if (img.startsWith('http://') || img.startsWith('https://')) return img;
      if (apiBase) {
        if (img.startsWith('/')) return `${apiBase}${img}`;
        return `${apiBase}/${img}`;
      }
      return img;
    };

    return discounted.slice(0, 8).map((p) => {
      const meta = computeDiscountMeta(p);
      const imageRaw =
        p?.featured_image?.url ||
        (Array.isArray(p?.images) && p.images[0]?.url) ||
        p?.image_url ||
        p?.image ||
        p?.thumbnail ||
        null;
      const image = imageRaw ? toAbsolute(imageRaw) : '/images/NoImageLong.jpg';

      return {
        image,
        url: p?.id != null ? `/product/${p.id}` : null,
        title: p?.name || p?.title || '',
        message: meta.percent > 0 ? `${meta.percent}% OFF` : '',
        price: meta.effectivePrice,
        comparePrice: meta.comparePrice,
        _productId: p?.id,
      };
    });
  }, [productsWithFlash]);

  // Read `search` query from URL (e.g., /home?search=burger)
  const searchParams = useSearchParams();
  const searchQuery = (searchParams?.get('search') || '').toLowerCase();
  const offersParam = (searchParams?.get('offers') || '') === '1';

  useEffect(() => {
    // If URL has offers=1, persist and trigger filter
    if (offersParam) {
      try {
        localStorage.setItem('offersOnly', 'true');
        window.dispatchEvent(new CustomEvent('offersToggled', { detail: { offersOnly: true } }));
      } catch {}
    }
  }, [offersParam]);

  let filteredProducts = searchQuery
    ? productsWithFlash.filter((p) => (p?.name || '').toLowerCase().includes(searchQuery))
    : productsWithFlash;

  // Client-side fallbacks for filters (if API doesn't apply them)
  try {
    const fee = localStorage.getItem('deliveryFee');
    const rating = localStorage.getItem('selectedRating');
    const offersOnly = localStorage.getItem('offersOnly') === 'true';
    const maxEtaMinutes = localStorage.getItem('maxEtaMinutes');
    const priceSel = localStorage.getItem('selectedPrice');
    const maxPrice = priceSel && priceSel !== '6' ? Number(priceSel) * 10 : null;
    const categoryId = localStorage.getItem('selectedCategoryId');
    const categoryName = localStorage.getItem('selectedCategoryName');

    if (maxPrice) {
      filteredProducts = filteredProducts.filter((p) => Number(p?.price ?? p?.final_price ?? p?.unit_price ?? 0) <= maxPrice);
    }
    if (fee && fee !== '6') {
      filteredProducts = filteredProducts.filter((p) => Number(p?.delivery_fee ?? Infinity) <= Number(fee));
    }
    if (rating) {
      filteredProducts = filteredProducts.filter((p) => {
        const avg = Number(p?.avg_rating ?? p?.rating ?? 0);
        return avg >= Number(rating);
      });
    }
    if (offersOnly) {
      filteredProducts = filteredProducts.filter((p) => Boolean(p?.has_offer || p?.discount || p?.flash_price));
    }
    if (maxEtaMinutes) {
      filteredProducts = filteredProducts.filter((p) => Number(p?.eta_minutes ?? Infinity) <= Number(maxEtaMinutes));
    }
    // Only apply client-side category filter if products actually have category information.
    if (categoryId || categoryName) {
      const normalize = (v) =>
        (v || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

      const anyHasCategory = filteredProducts.some((p) => {
        return (
          p?.category_id != null ||
          p?.categoryId != null ||
          (p?.category && p?.category?.id != null) ||
          Array.isArray(p?.categories)
        );
      });

      if (anyHasCategory) {
        filteredProducts = filteredProducts.filter((p) => {
          const idMatch =
            categoryId &&
            String(
              p?.category_id ?? p?.categoryId ?? p?.category?.id ?? ''
            ) === String(categoryId);

          const labels = [];
          if (p?.category?.name) labels.push(p.category.name);
          if (p?.category_name) labels.push(p.category_name);
          if (p?.categoryName) labels.push(p.categoryName);
          if (Array.isArray(p?.categories)) {
            p.categories.forEach((c) => {
              if (c?.name) labels.push(c.name);
              if (c?.title) labels.push(c.title);
              if (c?.slug) labels.push(c.slug);
            });
          }

          const nameMatch =
            categoryName &&
            labels.some(
              (label) => normalize(label).includes(normalize(categoryName))
            );

          return idMatch || nameMatch;
        });
      }
    }
    const sort = localStorage.getItem('selectedSortOption');
    if (sort === 'Rating') {
      // Sort by highest rated - only include products with actual ratings (> 0)
      filteredProducts = [...filteredProducts]
        .filter((p) => {
          const rating = Number(p?.avg_rating ?? p?.rating ?? 0);
          return rating > 0; // Only show products with actual ratings
        })
        .sort((a, b) => {
          const ratingA = Number(a?.avg_rating ?? a?.rating ?? 0);
          const ratingB = Number(b?.avg_rating ?? b?.rating ?? 0);
          return ratingB - ratingA; // Sort descending (highest first)
        });
    }
  } catch {}

  const recommendedProducts = [...filteredProducts]
    .sort((a, b) => (Number(b?.rating ?? 0)) - (Number(a?.rating ?? 0)))
    .slice(0, 12);

  // Only show loading state on initial load, not when filters change
  if (isInitialLoad && (productsLoading || flashLoading || storesLoading)) {
    return <p>{t('common.loadingProducts')}</p>;
  }
  if (productsError) return <p>{t('common.error')}: {productsError}</p>;
  if (flashError) return <p>{t('common.error')}: {flashError}</p>;
  if (storesError) return <p>{t('common.error')}: {storesError}</p>;

  return (
    <>
      <div className="flex flex-col gap-y-8 mt-[194px] sm:mt-6">
        <PushOptIn />
        <div className="categories">
          <div className="flex flex-nowrap justify-start">
            <CategoryNav />
          </div>
        </div>


        <div className="filter-nav w-full bg-white dark:bg-slate-900 py-2 sm:py-3 relative z-40 border-b border-gray-200 dark:border-slate-700 mt-8 sm:mt-6" style={{backgroundColor: 'white'}}>
          <FilterNav />
        </div>

        <div className="banner-slider">
          {/* Flash Sales / Campaigns Banner */}
          <BannerSlider 
            endpoint="/campaigns/active"
            channel="in_app"
            maxItems={8}
            autoPlayInterval={5000}
          />
        </div>

        <div className="product-slider">
          <ProductSlider
            title={t('product.popularProducts')}
            products={filteredProducts}
            openModal={handleProductView}
            viewAllHref="/products?section=popular"
            stores={allStores}
          />
        </div>

        <div className="store-near-you">
          <StoreNearYou stores={allStores} title={t('product.storeNearYou')} viewAllHref="/stores" />
        </div>

        <div className="best-selling-product hidden md:block">
          {/* <BestSellingProduct title="Best Selling Products" products={products} productNo={4} /> */}
          <BestSellingProduct title={t('product.bestSellingProducts')} products={filteredProducts} productNo={4} openModal={handleProductView} viewAllHref="/products?section=best-selling" stores={allStores} />
        </div>

        {/* Smart Recommendations - Shows recommendations based on user behavior - Only for logged in users */}
        {token && (
          <div className="smart-recommendations">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                {t('product.smartRecommendations')}
              </h2>
              <PersonalizedFeed onProductView={handleProductView} allProducts={allProducts} />
            </div>
          </div>
        )}

        {/* Recently Viewed Products - Only show this section for logged in users */}
        {token && (
          <div className="product-slider">
            <ProductSlider
              title={t('product.recentlyViewed')}
              products={recentlyViewed}
              openModal={handleProductView}
              viewAllHref="/products?section=recently-viewed"
              emptyMessage={t('product.noRecentlyViewed') || 'You haven\'t viewed any products yet. Start browsing to see your recently viewed items here!'}
              stores={allStores}
            />
          </div>
        )}
      </div>
    </>
  );
}
