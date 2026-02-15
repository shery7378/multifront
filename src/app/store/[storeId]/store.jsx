"use client";
//src/app/store/[storeId]/store.jsx
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { addItem } from "@/store/slices/cartSlice";
import { setDeliveryMode as setDeliveryModeAction } from "@/store/slices/deliverySlice";
import GoogleMapController from "@/controller/GoogleMapController";
import ReviewSlider from "@/components/ReviewSlider";
import { useI18n } from '@/contexts/I18nContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { storeFavorites } from "@/utils/favoritesApi";
import { ShareIcon, HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { StarIcon } from "@heroicons/react/24/solid";

export default function StorePage({ store, others }) {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
  const dispatch = useDispatch();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('Featured');
  const [isFollowing, setIsFollowing] = useState(false);
  // Get deliveryMode from Redux store instead of local state
  const deliveryMode = useSelector((state) => state.delivery?.mode || 'delivery');
  const [favoriteStores, setFavoriteStores] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [flashSalesData, setFlashSalesData] = useState(null);

  // Fetch active flash sales
  useEffect(() => {
    async function fetchFlashSales() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/flash-sales/active`);
        if (res.ok) {
          const data = await res.json();
          setFlashSalesData(data);
        }
      } catch (e) {
        console.error('Error fetching flash sales:', e);
      }
    }
    fetchFlashSales();
  }, []);

  // Filter products based on delivery mode and merge with flash sales
  const allProducts = useMemo(() => {
    const products = store?.products || [];

    // Create a map of flash sales for quick lookup
    const flashMap = {};
    if (flashSalesData?.data?.products) {
      flashSalesData.data.products.forEach(p => {
        if (p.id && (p.flash_price || p.pivot?.flash_price)) {
          flashMap[p.id] = p.flash_price || p.pivot?.flash_price;
        }
      });
    }

    const mergedProducts = products.map(p => {
      if (flashMap[p.id]) {
        return {
          ...p,
          flash_price: flashMap[p.id]
        };
      }
      return p;
    });

    // Debug log - always run
    console.log('[StorePage] Filtering products:', {
      mode: deliveryMode,
      totalProducts: mergedProducts.length,
    });

    if (deliveryMode === 'pickup') {
      // When pickup mode is selected, only show products with enable_pickup = true
      const filtered = mergedProducts.filter(p => {
        const hasPickup = p?.enable_pickup === true || p?.enablePickup === true;
        return hasPickup;
      });
      return filtered;
    }
    // For delivery mode, show all products (or filter by enable_delivery if needed)
    return mergedProducts;
  }, [store?.products, deliveryMode, flashSalesData]);

  // Check if store is already favorited
  useEffect(() => {
    async function checkFavorite() {
      try {
        const favoriteStoreIds = await storeFavorites.getAll();
        const storeId = String(store?.id || '');
        setIsFollowing(favoriteStoreIds.includes(storeId));
      } catch (e) {
        console.error('Error checking favorite:', e);
      }
    }
    if (store?.id) {
      checkFavorite();
    }
  }, [store?.id]);

  // Fetch favorite stores
  useEffect(() => {
    async function fetchFavoriteStores() {
      try {
        setLoadingFavorites(true);
        const base = process.env.NEXT_PUBLIC_API_URL;
        const favoriteStoreIds = await storeFavorites.getAll();

        if (favoriteStoreIds.length === 0) {
          setFavoriteStores(others || []);
          setLoadingFavorites(false);
          return;
        }

        try {
          const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('sanctum_token');
          const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const res = await fetch(`${base}/api/favorites/stores/data`, {
            headers,
            credentials: 'include',
            cache: "no-store"
          });

          if (res.ok) {
            const data = await res.json();
            const items = Array.isArray(data?.data) ? data.data : [];
            const currentStoreId = String(store?.id || '');
            const currentStoreSlug = String(store?.slug || '');

            const filtered = items.filter(s => {
              const storeId = String(s?.id || '');
              const storeSlug = String(s?.slug || '');
              const isCurrent = storeId === currentStoreId ||
                storeSlug === currentStoreSlug ||
                storeId === currentStoreSlug ||
                storeSlug === currentStoreId;
              return !isCurrent;
            });

            setFavoriteStores(filtered.length > 0 ? filtered : (others || []));
          } else {
            setFavoriteStores(others || []);
          }
        } catch (e) {
          console.error('Error fetching favorite stores:', e);
          setFavoriteStores(others || []);
        }
      } catch (e) {
        console.error('Error getting favorite store IDs:', e);
        setFavoriteStores(others || []);
      } finally {
        setLoadingFavorites(false);
      }
    }

    fetchFavoriteStores();
  }, [store?.id, others]);

  // Get store data with proper image URL construction
  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  const storeName = store?.name || 'Sunny Store';

  // Dynamic rating state (fetched from API)
  const [ratingData, setRatingData] = useState({
    rating: Number(store?.rating ?? store?.avg_rating ?? 0) || 0,
    reviewCount: Number(store?.reviews_count ?? store?.review_count ?? 0) || 0,
  });

  // Fetch dynamic rating from API
  useEffect(() => {
    const storeId = store?.id || store?.slug;
    if (!storeId) return;

    let cancelled = false;
    async function fetchRating() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        if (!apiBase) return;
        const res = await fetch(`${apiBase}/api/stores/${storeId}/rating`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return;
        const json = await res.json();
        // Use bayesian_rating first (preferred), then average_review_rating, fallback to average_rating
        const avg = Number(
          json?.data?.bayesian_rating ??
          json?.data?.average_review_rating ??
          json?.data?.average_rating ??
          0
        ) || 0;
        const count = Number(json?.data?.review_count ?? 0) || 0;

        if (!cancelled) {
          setRatingData({ rating: avg, reviewCount: count });
        }
      } catch {
        // fail silently; keep initial rating
      }
    }

    fetchRating();
    return () => {
      cancelled = true;
    };
  }, [store?.id, store?.slug]);

  const storeRating = ratingData.rating || 0;
  const reviewCount = ratingData.reviewCount || 0;

  // Banner image URL - handle both object and string formats
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (typeof imagePath === 'object' && imagePath?.url) {
      imagePath = imagePath.url;
    }

    const path = String(imagePath).trim();
    if (!path) return null;

    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    const cleanPath = path.replace(/^\/+/, '');
    return base ? `${base}/${cleanPath}` : `/${cleanPath}`;
  };

  const bannerPath = store?.banner_image || store?.banner_image_url || store?.banner?.url || null;
  const storeImage = getImageUrl(bannerPath) || '/images/banners/banner.png';

  // Store logo URL
  const logoPath = store?.logo || store?.logo_url || store?.logo_image?.url || null;
  const storeLogo = getImageUrl(logoPath) || '/images/stores/default-logo.png';

  // Build full address from store table fields
  const fullAddress = useMemo(() => {
    if (store?.full_address) return store.full_address;

    const addressParts = [];
    if (store?.address) addressParts.push(store.address);
    if (store?.city) addressParts.push(store.city);
    if (store?.zip_code) addressParts.push(store.zip_code);
    if (store?.country) addressParts.push(store.country);

    return addressParts.length > 0 ? addressParts.join(', ') : '';
  }, [store]);

  const latitude = parseFloat(store?.latitude) || 0;
  const longitude = parseFloat(store?.longitude) || 0;
  const hasLocation = latitude && longitude;
  const deliveryRadius = store?.delivery_radius || null;

  // Store details - dynamic from store data (empty if no data)
  const storeHours = useMemo(() => {
    // Try multiple possible fields for hours
    const hours = store?.hours || store?.opening_hours || store?.store_hours || store?.working_hours || null;
    if (hours) return hours;

    // Try to construct from opening/closing times
    const openingTime = store?.opening_time || store?.opening_hour;
    const closingTime = store?.closing_time || store?.closing_hour;
    if (openingTime && closingTime) {
      return `${openingTime}-${closingTime}`;
    }

    return ''; // Empty if no data
  }, [store]);

  const deliveryFee = useMemo(() => {
    const fee = store?.delivery_fee || store?.shipping_fee || store?.delivery_charge || store?.shipping_charge || null;
    if (fee !== null && fee !== undefined) {
      // If it's a number, format it
      if (typeof fee === 'number') {
        return formatPrice(fee);
      }
      // If it's a string, check if it already has currency symbol
      if (typeof fee === 'string' && fee.trim()) {
        return fee.includes('£') || fee.includes('$') || fee.includes('€') ? fee : formatPrice(parseFloat(fee) || 0);
      }
    }
    return ''; // Empty if no data
  }, [store, formatPrice]);

  const minOrder = useMemo(() => {
    const order = store?.minimum_order || store?.min_order || store?.minimum_order_amount || null;
    if (order !== null && order !== undefined) {
      // If it's a number, format it
      if (typeof order === 'number') {
        return formatPrice(order);
      }
      // If it's a string, check if it already has currency symbol
      if (typeof order === 'string' && order.trim()) {
        return order.includes('£') || order.includes('$') || order.includes('€') ? order : formatPrice(parseFloat(order) || 0);
      }
    }
    return ''; // Empty if no data
  }, [store, formatPrice]);

  // Categories for filtering - dynamic based on products in the store
  const categories = useMemo(() => {
    const catSet = new Set(['Featured', 'Popular']);
    // Extract categories from products (only categories that actually exist)
    allProducts.forEach(p => {
      // Try multiple possible category fields
      const cat = p?.category?.name || p?.category_name || p?.categoryName || p?.category || p?.type || '';
      if (cat && cat.trim()) {
        catSet.add(cat.trim());
      }
    });
    // Return categories (Featured and Popular first, then product categories)
    const categoryArray = Array.from(catSet);
    // Limit to 8 categories total (2 default + up to 6 product categories)
    return categoryArray.slice(0, 8);
  }, [allProducts]);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'Featured' || activeCategory === 'Popular') {
      return allProducts;
    }
    return allProducts.filter(p => {
      // Try multiple possible category fields for matching
      const cat = p?.category?.name || p?.category_name || p?.categoryName || p?.category || p?.type || '';
      return cat && cat.trim() === activeCategory;
    });
  }, [allProducts, activeCategory]);

  // Handle follow toggle
  const handleFollow = async () => {
    if (!store?.id) return;
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);

    try {
      if (wasFollowing) {
        await storeFavorites.remove(store.id);
      } else {
        await storeFavorites.add(store.id);
      }
    } catch (e) {
      console.error('Error toggling follow:', e);
      setIsFollowing(wasFollowing);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: storeName,
          text: `Check out ${storeName}`,
          url: window.location.href,
        });
      } catch (e) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Handle product click - navigate to product details
  const handleProductClick = (product) => {
    if (product?.id) {
      router.push(`/product/${product.id}`);
    }
  };

  // Handle add to cart
  const handleAddToCart = (product, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!product?.id) return;

    const numericBase = Number(product?.price_tax_excl || product?.price || 0);
    const numericFlash = product?.flash_price != null ? Number(product.flash_price) : null;
    const chosenPrice = Number.isFinite(numericFlash) ? numericFlash : numericBase;

    const payload = {
      id: product.id,
      product: product,
      price: chosenPrice,
      quantity: 1,
    };

    dispatch(addItem(payload));
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  // Handle start order
  const handleStartOrder = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div style={{
      background: '#F6F7FB',
      minHeight: '100vh',
      fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
    }}>
      {/* Success Message Toast */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 sm:top-5 sm:right-5 z-[9999] bg-[#10b981] text-white px-4 py-3 sm:px-5 sm:py-3 rounded-xl flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold max-w-[90vw] sm:max-w-none" style={{ animation: 'slideIn 0.3s ease-out' }}>
          <span>✓</span>
          <span>Product added to cart!</span>
        </div>
      )}
      <div className="max-w-[1240px] mx-auto px-3 sm:px-4 md:px-5 lg:px-6" style={{ padding: '12px 16px' }}>
        {/* Hero Banner */}
        <header
          className="h-32 sm:h-40 md:h-48 lg:h-64 rounded-2xl sm:rounded-3xl overflow-hidden mb-3 sm:mb-4 md:mb-5"
          style={{
            border: '1px solid #E9EDF5',
            backgroundImage: `url(${storeImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
          aria-label="Store cover image"
        />

        {/* Identity Row */}
        <section
          className="grid grid-cols-[auto_1fr_auto] gap-2 sm:gap-3 md:gap-4 items-center bg-white border border-[#E9EDF5] rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4"
          role="group"
          aria-label="Store identity"
        >
          <img
            src={storeLogo}
            alt={storeName}
            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl object-fill border-2 border-white flex-shrink-0"
            onError={(e) => {
              e.target.src = '/images/stores/default-logo.png';
            }}
          />
          <div className="min-w-0">
            <h1 className="m-0 font-extrabold text-lg sm:text-xl md:text-2xl lg:text-[26px] tracking-wide text-[#0E1320] truncate">
              {storeName}
            </h1>
            <div className="text-[#6B7280] text-xs sm:text-sm mt-1">
              {(() => {
                // Only show rating if there are actual reviews
                const ratingText = storeRating > 0 && reviewCount > 0 ? `${storeRating.toFixed(1)} (${reviewCount})` : '';
                // Get delivery time
                const deliveryTime = store?.delivery_time_text || store?.deliveryTime || store?.eta_minutes || store?.average_eta || store?.avg_eta || '';
                const deliveryTimeText = deliveryTime ? `${deliveryTime} min delivery` : '';
                // Open status
                const openStatus = store?.is_open !== undefined ? (store.is_open ? 'Open now' : 'Closed') : 'Open now';

                // Combine all parts
                const items = [ratingText, deliveryTimeText, openStatus].filter(Boolean);
                return items.length > 0 ? items.join(' • ') : 'Open now';
              })()}
            </div>
          </div>
          <div
            className="inline-grid grid-flow-col gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-[#F2F4FA] rounded-full flex-shrink-0"
            role="tablist"
            aria-label="Fulfilment"
          >
            <button
              onClick={() => dispatch(setDeliveryModeAction('delivery'))}
              className="border-0 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm cursor-pointer transition-colors"
              style={{
                background: deliveryMode === 'delivery' ? '#F44422' : 'transparent',
                color: deliveryMode === 'delivery' ? '#fff' : '#0E1320',
              }}
              aria-pressed={deliveryMode === 'delivery'}
            >
              Delivery
            </button>
            <button
              onClick={() => dispatch(setDeliveryModeAction('pickup'))}
              className="border-0 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm cursor-pointer transition-colors"
              style={{
                background: deliveryMode === 'pickup' ? '#F44422' : 'transparent',
                color: deliveryMode === 'pickup' ? '#fff' : '#0E1320',
              }}
              aria-pressed={deliveryMode === 'pickup'}
            >
              Pickup
            </button>
          </div>
        </section>

        {/* Content Grid */}
        <section
          className="layout-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            gap: '18px'
          }}
        >
          {/* Left Sidebar - Map */}
          <aside>
            <div style={{
              background: '#fff',
              border: '1px solid #E9EDF5',
              borderRadius: '16px',
                            padding: '14px'
            }}>
              <strong style={{
                fontWeight: 700,
                color: '#0E1320',
                display: 'block',
                marginBottom: '10px'
              }}>
                Store map
              </strong>
              <div style={{
                height: '300px',
                borderRadius: '12px',
                border: '1px solid #E9EDF5',
                background: 'linear-gradient(180deg,#DDE7FB,#F3F6FF)',
                marginTop: '10px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {hasLocation ? (
                  <GoogleMapController
                    center={{ lat: latitude, lng: longitude }}
                    zoom={14}
                    marker
                    className="w-full h-full"
                    style={{ width: '100%', height: '100%' }}
                    options={{
                      disableDefaultUI: true,
                      draggable: false,
                      scrollwheel: false,
                      disableDoubleClickZoom: true,
                    }}
                    fallback={
                      <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundImage: 'radial-gradient(120px 60px at 20% 40%, rgba(244,68,34,.18), transparent 60%), linear-gradient(180deg,#DDE7FB,#F3F6FF)'
                      }} />
                    }
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: 'radial-gradient(120px 60px at 20% 40%, rgba(244,68,34,.18), transparent 60%), linear-gradient(180deg,#DDE7FB,#F3F6FF)'
                  }} />
                )}
              </div>
              <div style={{
                marginTop: '10px',
                fontSize: '13px',
                color: '#6B7280'
              }}>
                {fullAddress && (
                  <>
                    {fullAddress}
                    {deliveryRadius && ` • Coverage within ${deliveryRadius} km`}
                  </>
                )}
              </div>
            </div>
          </aside>

          {/* Right Content */}
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              {/* Store Details */}
              <div className="bg-white border border-[#E9EDF5] rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <div className="font-bold mb-1.5 sm:mb-2 text-sm sm:text-base text-[#0E1320]">
                  Store details
                </div>
                {/* Basic store details */}
                {[
                  storeHours && `Hours ${storeHours}`,
                  deliveryFee && `Delivery fee from ${deliveryFee}`,
                  minOrder && `Minimum order ${minOrder}`
                ].filter(Boolean).length > 0 && (
                    <div className="text-[#6B7280] text-xs sm:text-sm mb-2 sm:mb-3">
                      {[
                        storeHours && `Hours ${storeHours}`,
                        deliveryFee && `Delivery fee from ${deliveryFee}`,
                        minOrder && `Minimum order ${minOrder}`
                      ].filter(Boolean).join(' • ')}
                    </div>
                  )}
                {/* Additional store information from database */}
                {(store?.description || store?.contact_email || store?.contact_phone) && (
                  <div style={{
                    marginTop: storeHours || deliveryFee || minOrder ? '12px' : '0',
                    paddingTop: storeHours || deliveryFee || minOrder ? '12px' : '0',
                    borderTop: storeHours || deliveryFee || minOrder ? '1px solid #E9EDF5' : 'none'
                  }}>
                    {store?.description && (
                      <div style={{
                        color: '#6B7280',
                        fontSize: '13px',
                        marginBottom: '8px',
                        lineHeight: '1.5'
                      }}>
                        {store.description}
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      fontSize: '12px',
                      color: '#6B7280'
                    }}>
                      {store?.contact_email && (
                        <div>
                          <strong>Email:</strong> <a href={`mailto:${store.contact_email}`} style={{ color: '#F44422', textDecoration: 'none' }}>{store.contact_email}</a>
                        </div>
                      )}
                      {store?.contact_phone && (
                        <div>
                          <strong>Phone:</strong> <a href={`tel:${store.contact_phone}`} style={{ color: '#F44422', textDecoration: 'none' }}>{store.contact_phone}</a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Show message only if no details at all */}
                {!storeHours && !deliveryFee && !minOrder && !store?.description && !store?.contact_email && !store?.contact_phone && (
                  <div style={{
                    color: '#6B7280',
                    fontSize: '13px',
                    marginBottom: '10px'
                  }}>
                    No store details available
                  </div>
                )}
                <div style={{
                  marginTop: '10px',
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={handleStartOrder}
                    style={{
                      background: '#111',
                      color: '#fff',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      border: 0,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  >
                    Start Order
                  </button>
                  <button
                    onClick={handleFollow}
                    style={{
                      background: '#F8FAFE',
                      border: '1px solid #E9EDF5',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px',
                      color: '#0E1320',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {isFollowing ? (
                      <>
                        <HeartSolidIcon style={{ width: '16px', height: '16px', color: '#F44422' }} />
                        Following
                      </>
                    ) : (
                      <>
                        <HeartIcon style={{ width: '16px', height: '16px' }} />
                        Follow
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    style={{
                      background: '#F8FAFE',
                      border: '1px solid #E9EDF5',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px',
                      color: '#0E1320',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ShareIcon style={{ width: '16px', height: '16px' }} />
                    Share
                  </button>
                </div>
              </div>

              {/* Performance */}
              <div className="bg-white border border-[#E9EDF5] rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <div className="font-bold mb-1.5 sm:mb-2 text-sm sm:text-base text-[#0E1320]">
                  Performance
                </div>
                <div className="text-[#6B7280] text-xs sm:text-sm">
                  {(() => {
                    // Only show rating if there are actual reviews
                    const avgRating = storeRating > 0 && reviewCount > 0 ? `Avg rating ${storeRating.toFixed(1)}` : '';
                    const avgEta = store?.average_eta || store?.avg_eta || store?.eta_minutes || store?.delivery_time_text || store?.deliveryTime;
                    const etaText = avgEta ? `Avg ETA ${avgEta} min` : '';
                    const onTimeRate = store?.on_time_rate || store?.on_time_percentage || store?.delivery_success_rate;
                    const onTimeText = onTimeRate ? `On-time rate ${onTimeRate}%` : '';
                    const returnsPeriod = store?.returns_policy || store?.returns_period;
                    const returnsText = returnsPeriod ? `${returnsPeriod}-day returns` : '';

                    const performanceItems = [avgRating, etaText, onTimeText, returnsText].filter(Boolean);
                    return performanceItems.length > 0 ? performanceItems.join(' • ') : 'No performance data available';
                  })()}
                </div>
              </div>
            </div>

            {/* Category Tabs */}
            {allProducts.length > 0 && (
              <div className="flex gap-2 sm:gap-3 flex-wrap my-3 sm:my-4 md:my-5 overflow-x-auto pb-2" role="tablist">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="border rounded-xl px-3 py-2 sm:px-4 sm:py-2 cursor-pointer font-semibold text-xs sm:text-sm whitespace-nowrap transition-colors"
                    style={{
                      border: '1px solid #E9EDF5',
                      background: activeCategory === cat ? '#111' : '#fff',
                      color: activeCategory === cat ? '#fff' : '#0E1320',
                      borderColor: activeCategory === cat ? '#111' : '#E9EDF5',
                    }}
                    aria-pressed={activeCategory === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Products Grid */}
            {allProducts.length > 0 ? (
              <section className="product-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.slice(0, 4).map((product) => {
                  const basePrice = Number(product?.price_tax_excl || 0);
                  const flashPrice = product?.flash_price != null ? Number(product.flash_price) : null;
                  const comparePrice = Number(product?.compared_price || 0);
                  const displayPrice = flashPrice != null ? flashPrice : basePrice;
                  const originalPrice = flashPrice != null ? basePrice : comparePrice;
                  const hasDiscount = originalPrice > displayPrice && originalPrice > 0;

                  const featuredPath = product?.featured_image?.url ||
                    product?.featured_image?.path ||
                    product?.image ||
                    null;
                  const productImage = featuredPath
                    ? (featuredPath.startsWith('http') ? featuredPath : `${base}/${String(featuredPath).replace(/^\/+/, '')}`)
                    : '/images/NoImageLong.jpg';

                  return (
                    <article
                      key={product.id}
                      style={{
                        background: '#fff',
                        border: '1px solid #E9EDF5',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={() => handleProductClick(product)}
                    >
                      <div style={{
                        width: '100%',
                        aspectRatio: '1/1',
                        position: 'relative',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img
                          src={productImage}
                          alt={product.name}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            pointerEvents: 'none'
                          }}
                          onError={(e) => {
                            e.target.src = '/images/NoImageLong.jpg';
                          }}
                        />
                      </div>
                      {hasDiscount && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          background: '#EF4444',
                          color: '#fff',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}>
                          -{Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}%
                        </div>
                      )}
                      <div style={{ padding: '12px' }}>
                        <h3 style={{
                          margin: '0 0 6px 0',
                          fontWeight: 600,
                          fontSize: '15px',
                          color: '#0E1320',
                          pointerEvents: 'none'
                        }}>
                          {product.name}
                        </h3>
                        <div style={{
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'center',
                          marginBottom: '8px',
                          pointerEvents: 'none'
                        }}>
                          <span style={{
                            color: '#F44422',
                            fontWeight: 800,
                            fontSize: '16px'
                          }}>
                            {formatPrice(displayPrice)}
                          </span>
                          {hasDiscount && (
                            <span style={{
                              textDecoration: 'line-through',
                              color: '#9CA3AF',
                              fontSize: '13px'
                            }}>
                              {formatPrice(originalPrice)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          style={{
                            border: 0,
                            background: '#111',
                            color: '#fff',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            width: '100%',
                            marginTop: '8px',
                            fontSize: '14px',
                            pointerEvents: 'auto'
                          }}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            ) : (
              <section
                style={{
                  background: '#fff',
                  border: '1px solid #E9EDF5',
                  borderRadius: '16px',
                  padding: '40px 20px',
                  textAlign: 'center'
                }}
              >
                <p style={{
                  color: '#6B7280',
                  fontSize: '16px',
                  margin: 0
                }}>
                  {deliveryMode === 'pickup'
                    ? 'No products available for pickup at this store.'
                    : 'No products available for delivery from this store.'}
                </p>
                <p style={{
                  color: '#9CA3AF',
                  fontSize: '14px',
                  marginTop: '8px',
                  margin: '8px 0 0 0'
                }}>
                  Please try a different delivery mode or check back later.
                </p>
              </section>
            )}
          </div>
        </section>

        {/* Reviews Section - Bottom */}
        <section className="bg-white border border-[#E9EDF5] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 mt-4 sm:mt-6 mb-4 sm:mb-6">
          <ReviewSlider storeId={store?.id || store?.slug} />
        </section>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @media (max-width: 1100px) {
          .layout-grid {
            grid-template-columns: 1fr !important;
          }
          .product-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 700px) {
          .product-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}} />
    </div>
  );
}
