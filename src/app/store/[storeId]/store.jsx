"use client";
//src/app/store/[storeId]/store.jsx
import { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { addItem } from "@/store/slices/cartSlice";
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
  const [deliveryMode, setDeliveryMode] = useState('delivery');
  const [favoriteStores, setFavoriteStores] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const allProducts = store?.products || [];

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

  const storeRating = ratingData.rating;
  const reviewCount = ratingData.reviewCount;
  
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
  
  const fullAddress = store?.full_address || '1 Buckingham Palace Rd, London';
  const latitude = parseFloat(store?.latitude) || 0;
  const longitude = parseFloat(store?.longitude) || 0;
  const hasLocation = latitude && longitude;

  // Store details
  const storeHours = store?.hours || '09:00-21:00';
  const deliveryFee = store?.delivery_fee || store?.shipping_fee || '£2.29';
  const minOrder = store?.minimum_order || store?.min_order || '£10';

  // Categories for filtering
  const categories = useMemo(() => {
    const catSet = new Set(['Featured', 'Popular']);
    allProducts.forEach(p => {
      const cat = p?.category || p?.categoryName || p?.type || '';
      if (cat) catSet.add(cat);
    });
    const defaultCats = ['Mobiles', 'Accessories', 'Wearables', 'Kitchen'];
    defaultCats.forEach(cat => catSet.add(cat));
    return Array.from(catSet).slice(0, 6);
  }, [allProducts]);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'Featured' || activeCategory === 'Popular') {
      return allProducts;
    }
    return allProducts.filter(p => {
      const cat = p?.category || p?.categoryName || p?.type || '';
      return cat === activeCategory;
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
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: '#10b981',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: 600,
          animation: 'slideIn 0.3s ease-out'
        }}>
          <span>✓</span>
          <span>Product added to cart!</span>
        </div>
      )}
      <div style={{ maxWidth: '1240px', margin: 'auto', padding: '20px' }}>
        {/* Hero Banner */}
        <header 
          style={{
            height: '260px',
            borderRadius: '24px',
            overflow: 'hidden',
            marginBottom: '20px',
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
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: '14px',
            alignItems: 'center',
            background: '#fff',
            border: '1px solid #E9EDF5',
            borderRadius: '16px',
            padding: '14px',
            boxShadow: '0 10px 30px rgba(15,23,42,.06)',
            marginBottom: '16px'
          }}
          role="group"
          aria-label="Store identity"
        >
          <img 
            src={storeLogo} 
            alt={storeName}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              objectFit: 'fill',
              border: '2px solid #fff',
              boxShadow: '0 6px 18px rgba(0,0,0,.1)'
            }}
            onError={(e) => {
              e.target.src = '/images/stores/default-logo.png';
            }}
          />
          <div>
            <h1 style={{
              margin: 0,
              fontWeight: 800,
              fontSize: '26px',
              letterSpacing: '.2px',
              color: '#0E1320'
            }}>
              {storeName}
            </h1>
            <div style={{
              color: '#6B7280',
              fontSize: '13px',
              marginTop: '4px'
            }}>
              {storeRating.toFixed(1)} ({reviewCount}) • Open now
            </div>
          </div>
          <div 
            style={{
              display: 'inline-grid',
              gridAutoFlow: 'column',
              gap: '6px',
              padding: '6px',
              background: '#F2F4FA',
              borderRadius: '999px'
            }}
            role="tablist"
            aria-label="Fulfilment"
          >
            <button
              onClick={() => setDeliveryMode('delivery')}
              style={{
                border: 0,
                background: deliveryMode === 'delivery' ? '#F44422' : 'transparent',
                color: deliveryMode === 'delivery' ? '#fff' : '#0E1320',
                padding: '8px 12px',
                borderRadius: '999px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: deliveryMode === 'delivery' ? '0 8px 18px rgba(244,68,34,0.22)' : 'none'
              }}
              aria-pressed={deliveryMode === 'delivery'}
            >
              Delivery
            </button>
            <button
              onClick={() => setDeliveryMode('pickup')}
              style={{
                border: 0,
                background: deliveryMode === 'pickup' ? '#F44422' : 'transparent',
                color: deliveryMode === 'pickup' ? '#fff' : '#0E1320',
                padding: '8px 12px',
                borderRadius: '999px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: deliveryMode === 'pickup' ? '0 8px 18px rgba(244,68,34,0.22)' : 'none'
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
              boxShadow: '0 10px 30px rgba(15,23,42,.06)',
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
                {fullAddress} • Coverage within 10 km
              </div>
            </div>
          </aside>

          {/* Right Content */}
          <div>
            {/* Stats Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              marginBottom: '12px'
            }}>
              {/* Store Details */}
              <div style={{
                background: '#fff',
                border: '1px solid #E9EDF5',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(15,23,42,.06)',
                padding: '14px'
              }}>
                <div style={{
                  fontWeight: 700,
                  marginBottom: '6px',
                  color: '#0E1320'
                }}>
                  Store details
                </div>
                <div style={{
                  color: '#6B7280',
                  fontSize: '13px',
                  marginBottom: '10px'
                }}>
                  Hours {storeHours} • Delivery fee from {deliveryFee} • Minimum order {minOrder}
                </div>
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
              <div style={{
                background: '#fff',
                border: '1px solid #E9EDF5',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(15,23,42,.06)',
                padding: '14px'
              }}>
                <div style={{
                  fontWeight: 700,
                  marginBottom: '6px',
                  color: '#0E1320'
                }}>
                  Performance
                </div>
                <div style={{
                  color: '#6B7280',
                  fontSize: '13px'
                }}>
                  Avg rating {storeRating.toFixed(1)} • Avg ETA 28 min • On-time rate 98% • 30-day returns
                </div>
              </div>
            </div>

            {/* Category Tabs */}
            {allProducts.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                margin: '18px 2px'
              }} role="tablist">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      border: '1px solid #E9EDF5',
                      background: activeCategory === cat ? '#111' : '#fff',
                      color: activeCategory === cat ? '#fff' : '#0E1320',
                      borderColor: activeCategory === cat ? '#111' : '#E9EDF5',
                      borderRadius: '12px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                    aria-pressed={activeCategory === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Products Grid */}
            {allProducts.length > 0 && (
              <section 
                className="product-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '16px'
                }}
              >
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
                        cursor: 'pointer'
                      }}
                      onClick={() => handleProductClick(product)}
                    >
                      <img
                        src={productImage}
                        alt={product.name}
                        style={{
                          width: '100%',
                          aspectRatio: '1/1',
                          objectFit: 'cover',
                          pointerEvents: 'none'
                        }}
                        onError={(e) => {
                          e.target.src = '/images/NoImageLong.jpg';
                        }}
                      />
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
            )}
          </div>
        </section>

        {/* Reviews Section - Bottom */}
        <section style={{
          background: '#fff',
          border: '1px solid #E9EDF5',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(15,23,42,.06)',
          padding: '20px',
          marginTop: '24px',
          marginBottom: '24px'
        }}>
          <ReviewSlider storeId={store?.id || store?.slug} />
        </section>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
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
