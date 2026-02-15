// src/app/browse-stores/page.jsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bars3Icon, ChevronLeftIcon, ChevronRightIcon, PlusSmallIcon, MinusSmallIcon, StarIcon } from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import { useGetRequest } from '@/controller/getRequests';
import ProductCard from '@/components/ProductCard';
import ProductSlider from '@/components/ProductSlider';
import MoreToExplore from '@/components/MoreToExplore';
import BannerSlider from '@/components/BannerSlider';
import StoreCard from '@/components/StoreCard';
import { useI18n } from '@/contexts/I18nContext';
import { storeFavorites } from "@/utils/favoritesApi";

export default function BrowseStoresPage() {
  const { t } = useI18n();
  const deliveryMode = useSelector((state) => state.delivery.mode);
  const user = useSelector((state) => state?.auth?.user);
  const router = useRouter();
  const { data: productsResp, error, loading, sendGetRequest } = useGetRequest();
  const { data: flashResp, error: flashError, loading: flashLoading, sendGetRequest: getFlash } = useGetRequest();
  const { data: storesResp, sendGetRequest: sendGetStores } = useGetRequest();
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('Featured');
  const [stores, setStores] = useState([]);
  const [favoriteStores, setFavoriteStores] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Featured');

  // Redirect vendor users to their own store
  useEffect(() => {
    try {
      const currentUser = user || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null);
      const roles = currentUser?.roles || (currentUser?.role ? [currentUser.role] : []);
      const isVendor = Array.isArray(roles) && roles.map((r) => String(r).toLowerCase()).includes('vendor');
      const storeSlug = currentUser?.store?.slug || currentUser?.store_slug || currentUser?.store?.id || null;
      if (isVendor && storeSlug) {
        router.replace(`/store/${storeSlug}`);
        return; // do not fetch browse products
      }
    } catch { }
  }, [user, router]);

  useEffect(() => {
    async function fetchProducts() {
      let lat = localStorage.getItem('lat');
      let lng = localStorage.getItem('lng');
      const modeParam = `mode=${deliveryMode}`;
      let url = '';

      if (lat && lng) {
        url = `/products/getNearbyProducts?lat=${lat}&lng=${lng}&${modeParam}`;
      } else {
        url = `/products/getAllProducts?${modeParam}`;
      }

      await sendGetRequest(url);
      await getFlash('/flash-sales/active');
    }
    fetchProducts();
  }, [deliveryMode, sendGetRequest, getFlash]);

  // Fetch stores list for More to Explore
  useEffect(() => {
    async function fetchStores() {
      let lat = localStorage.getItem('lat');
      let lng = localStorage.getItem('lng');

      // Try to get coordinates from postcode if not available
      if ((!lat || !lng) && localStorage.getItem('postcode')) {
        try {
          const { getLatLngFromPostcode } = await import('@/controller/getLatLngFromPostcode');
          const postcode = localStorage.getItem('postcode');
          const coords = await getLatLngFromPostcode(postcode, 'UK');
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
            localStorage.setItem('lat', lat);
            localStorage.setItem('lng', lng);
          }
        } catch (error) {
          console.error('Error getting coordinates from postcode:', error);
        }
      }

      // Get default location if still no coordinates
      if (!lat || !lng) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const response = await fetch(`${apiUrl}/api/default-location`);
          if (response.ok) {
            const data = await response.json();
            if (data.status === 200 && data.data) {
              lat = data.data.default_location_latitude;
              lng = data.data.default_location_longitude;
              localStorage.setItem('lat', lat.toString());
              localStorage.setItem('lng', lng.toString());
            }
          }
        } catch (error) {
          console.error('Error fetching default location:', error);
        }
      }

      const modeParam = `mode=${deliveryMode}`;
      let url = `/stores/getAllStores?${modeParam}`;
      const postcode = localStorage.getItem('postcode');

      // Check if postcode is a valid UK postcode format
      const postalCodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
      const isPostcode = postcode && postalCodePattern.test(postcode.trim());

      // If we have coordinates, use them for filtering
      if (lat && lng) {
        url += `&lat=${lat}&lng=${lng}`;
        // If it's a postcode, also send it for exact matching and use smaller radius
        if (isPostcode) {
          url += `&postcode=${encodeURIComponent(postcode.trim())}`;
          url += `&radius=2`; // Use smaller radius (2km) for postcode searches
          console.log('📍 Using coordinates + postcode for precise store filtering (browse-stores):', { lat, lng, postcode: postcode.trim() });
        } else {
          console.log('🌍 Using coordinates for store filtering (browse-stores):', { lat, lng });
        }
      } else {
        // Only use city/postcode filtering if we don't have coordinates
        if (isPostcode) {
          // Send postcode for exact matching
          url += `&postcode=${encodeURIComponent(postcode.trim())}`;
          console.log('📮 Using postcode for store filtering (browse-stores):', postcode.trim());
        } else {
          // Use city filtering for non-postcode entries
          let cityName = localStorage.getItem('city');

          // If no city in localStorage, try to extract from postcode
          if (!cityName && postcode) {
            const parts = postcode.split(',');
            cityName = parts[0].trim();
          }

          // Add city parameter if we have a city name and no coordinates
          if (cityName) {
            url += `&city=${encodeURIComponent(cityName)}`;
            console.log('✅ Adding city parameter to URL (browse-stores, no coordinates):', cityName);
          } else {
            console.log('⚠️ No city name or coordinates available to send to API (browse-stores)');
          }
        }
      }

      console.log('🔗 Final API URL (browse-stores):', url);
      await sendGetStores(url);
    }
    fetchStores();
  }, [sendGetStores, deliveryMode]);

  function RatingCarousel() {
    const items = [
      { name: 'Floyd Miles', text: 'Amet enim mollit non deserunt ullamco est sit aliqua dolor do amet sint.', stars: 4.5, avatar: '/images/avatar-1.png' },
      { name: 'Ronald Richards', text: 'Ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.', stars: 5, avatar: '/images/avatar-2.png' },
      { name: 'Savannah Nguyen', text: 'Exercitation veniam consequat sunt nostrud amet.', stars: 4, avatar: '/images/avatar-3.png' },
    ];
    return (
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {items.map((it, i) => (
            <div key={i} className="w-[360px] border border-gray-200 rounded-xl p-4 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                  <img src={it.avatar} alt={it.name} className="w-full h-full object-cover" />
                </div>
                <div className="font-medium text-slate-900 text-sm">{it.name}</div>
                <div className="ml-auto flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <StarIcon key={idx} className={`w-4 h-4 ${idx < Math.round(it.stars) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600 line-clamp-5">{it.text} {it.text} {it.text}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-3 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F24E2E]/60"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#F24E2E]/80"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#F24E2E]/60"></span>
        </div>
      </div>
    );
  }

  function FAQSection() {
    const faqs = [
      {
        q: "Can I order McDonald's® - High Street North delivery in London with Multikonnect?",
        a: "You'll receive instant email or SMS alerts the moment a new review is posted—keeping you in control, wherever you are.",
      },
      { q: 'Is McDonald\'s® - High Street North delivery available near me?', a: '' },
      { q: 'How do I order McDonald\'s® - High Street North delivery online in London?', a: '' },
      { q: 'Where can I find McDonald\'s® - High Street North online menu prices?', a: '' },
    ];
    const [open, setOpen] = useState(0);
    return (
      <div className="divide-y divide-gray-200 border-t border-b">
        {faqs.map((item, idx) => (
          <div key={idx} className="py-3">
            <button onClick={() => setOpen(open === idx ? -1 : idx)} className="w-full flex items-center text-left gap-3">
              <span className="flex-1 text-[15px] font-medium text-slate-900">{item.q}</span>
              {open === idx ? (
                <span className="w-7 h-7 rounded-full border grid place-items-center text-slate-700"><MinusSmallIcon className="w-5 h-5" /></span>
              ) : (
                <span className="w-7 h-7 rounded-full border grid place-items-center text-slate-700"><PlusSmallIcon className="w-5 h-5" /></span>
              )}
            </button>
            {open === idx && item.a && (
              <p className="mt-1 text-sm text-slate-500">{item.a}</p>
            )}
          </div>
        ))}
      </div>
    );
  }

  function ExploreMoreStrip() {
    const items = [
      { name: 'Wingstop', rating: 4.5, eta: '15 - 20 min', badge: 'Spend £20, get 20% off', logo: '/images/logo-wing.png' },
      { name: '7Bone', rating: 4.6, eta: '15 - 25 min', badge: '2024 Award Winner', logo: '/images/logo-7bone.png' },
      { name: 'Wagamama', rating: 4.4, eta: '20 - 35 min', badge: "Deliveroo's Choice", logo: '/images/logo-waga.png' },
      { name: 'Coriander Lounge', rating: 4.6, eta: '15 - 30 min', badge: '', logo: '/images/logo-coriander.png' },
    ];
    return (
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max">
          {items.map((s, i) => (
            <div key={i} className="w-[260px] border border-gray-200 rounded-xl p-3 bg-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-gray-100 overflow-hidden">
                <img src={s.logo} alt={s.name} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900">{s.name}</div>
                <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1"><StarIcon className="w-4 h-4 text-amber-400" /> {s.rating}</span>
                  <span>•</span>
                  <span>{s.eta}</span>
                </div>
                {s.badge && <div className="mt-1 text-[11px] text-[#F24E2E]">{s.badge}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const normalizeProduct = (p) => {
    const price = Number(p?.price_tax_excl ?? p?.price ?? p?.salePrice ?? p?.amount ?? 0) || 0;
    const compared = Number(p?.compared_price ?? p?.compareAt ?? p?.mrp ?? p?.oldPrice ?? price) || price;
    const imageCandidate = p?.featured_image?.url || p?.image || p?.imageUrl || p?.thumbnail || p?.images?.[0]?.url;
    return {
      ...p,
      name: p?.name || p?.title || 'Product',
      price_tax_excl: price,
      compared_price: compared,
      featured_image: p?.featured_image || (imageCandidate ? { url: imageCandidate } : undefined),
      rating: Number(p?.rating ?? p?.stars ?? 4.5),
      reviews: Array.isArray(p?.reviews) ? p.reviews : (typeof p?.reviewCount === 'number' ? new Array(p.reviewCount).fill(0) : []),
    };
  };

  useEffect(() => {
    if (productsResp?.data) {
      try {
        const arr = Array.isArray(productsResp.data) ? productsResp.data : [];
        const flashMap = (flashResp?.data?.products || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
        const merged = arr.map((p) => {
          const fp = flashMap[p.id];
          return fp ? { ...p, flash_price: fp.flash_price } : p;
        });
        setProducts(merged.map(normalizeProduct));
      } catch {
        setProducts([]);
      }
    }
  }, [productsResp, flashResp]);

  useEffect(() => {
    if (storesResp?.data) {
      try {
        const arr = Array.isArray(storesResp.data) ? storesResp.data : [];
        setStores(arr);
      } catch {
        setStores([]);
      }
    }
  }, [storesResp]);

  const normalizedStores = useMemo(() => {
    return (stores || []).map((s) => {
      const logoUrl = s?.logo?.url
        ? (s.logo.url.startsWith('http://') || s.logo.url.startsWith('https://'))
          ? s.logo.url
          : `${process.env.NEXT_PUBLIC_API_URL}/${s.logo.url.replace(/^\//, '')}`
        : s?.logoUrl || s?.image || s?.banner_image || '';
      return {
        id: s?.id,
        name: s?.name || s?.title || 'Store',
        slug: s?.slug || String(s?.id || ''),
        rating: s?.rating ?? s?.avg_rating ?? 0,
        deliveryTime: s?.delivery_time_text || s?.eta || '15 - 30 min',
        offer: s?.offer || '',
        award: s?.award || '',
        choice: s?.choice || '',
        cuisine: s?.cuisine || s?.category_name || '',
        note: s?.note || '',
        logo: logoUrl,
        user_id: s?.user_id || null, // Add user_id for contact vendor button
      };
    });
  }, [stores]);

  // Filter stores by selected category
  const filteredStoresByCategory = useMemo(() => {
    if (selectedCategory === 'Featured' || selectedCategory === 'Popular') {
      return normalizedStores;
    }
    // Filter stores that have products in the selected category
    return normalizedStores.filter(store => {
      // Check if any product from this store matches the category
      return products.some(p => {
        const productStoreId = p?.store_id || p?.store?.id;
        const storeId = store.id;
        if (String(productStoreId) !== String(storeId)) return false;

        const cat = p?.category?.name || p?.category_name || p?.categoryName || p?.category || p?.type || '';
        return cat && cat.trim() === selectedCategory;
      });
    });
  }, [normalizedStores, products, selectedCategory]);

  // Randomly select one store from the filtered list
  const randomStore = useMemo(() => {
    if (!filteredStoresByCategory || filteredStoresByCategory.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * filteredStoresByCategory.length);
    return filteredStoresByCategory[randomIndex];
  }, [filteredStoresByCategory]);

  // Redirect to store page if a random store is found
  useEffect(() => {
    if (randomStore && randomStore.slug) {
      // Pass category as query parameter
      const categoryParam = selectedCategory !== 'Featured' ? `?category=${encodeURIComponent(selectedCategory)}` : '';
      router.replace(`/store/${randomStore.slug}${categoryParam}`);
    }
  }, [randomStore, router, selectedCategory]);

  // Fetch favorite stores for "More to Explore" section
  useEffect(() => {
    async function fetchFavoriteStores() {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL;

        // Get favorite store IDs
        const favoriteStoreIds = await storeFavorites.getAll();
        console.log('🏪 [BrowseStores] Favorite store IDs:', favoriteStoreIds);

        if (favoriteStoreIds.length === 0) {
          console.log('🏪 [BrowseStores] No favorite stores, using normalized stores');
          setFavoriteStores(normalizedStores);
          return;
        }

        // Fetch favorite stores directly
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
            console.log('✅ [BrowseStores] Fetched favorite stores:', items.length);

            // Normalize favorite stores to match the format
            const normalized = items.map((s) => {
              const logoUrl = s?.logo
                ? (s.logo.startsWith('http') ? s.logo : `${base}/${s.logo}`)
                : '';
              return {
                id: s?.id,
                name: s?.name || 'Store',
                slug: s?.slug || String(s?.id || ''),
                rating: s?.rating ?? 0,
                deliveryTime: s?.delivery_time_text || '15 - 30 min',
                offer: s?.offer || '',
                award: s?.award || '',
                choice: s?.choice || '',
                cuisine: s?.cuisine || '',
                note: s?.note || '',
                logo: logoUrl,
                user_id: s?.user_id || null,
              };
            });
            setFavoriteStores(normalized);
          } else {
            console.log('⚠️ [BrowseStores] Could not fetch favorite stores, using normalized stores');
            setFavoriteStores(normalizedStores);
          }
        } catch (e) {
          console.error('❌ [BrowseStores] Error fetching favorite stores:', e);
          setFavoriteStores(normalizedStores);
        }
      } catch (e) {
        console.error('❌ [BrowseStores] Error getting favorite store IDs:', e);
        setFavoriteStores(normalizedStores);
      }
    }

    fetchFavoriteStores();
  }, [normalizedStores]);

  // Build categories dynamically from product data
  const categories = useMemo(() => {
    const catSet = new Set(['Featured', 'Popular']);
    const getCat = (p) => p?.category?.name || p?.category_name || p?.categoryName || p?.category || p?.type || p?.department || '';
    products.forEach((p) => {
      const cat = getCat(p);
      if (cat && cat.trim()) {
        catSet.add(cat.trim());
      }
    });
    const arr = Array.from(catSet);
    return arr.slice(0, 8); // Limit to 8 categories
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeTab === 'Featured') return products;

    const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

    const TAB_ALIASES = {
      gamegaged: new Set(['gamegaged', 'gaming', 'gamegadget', 'games']),
      popularproducts: new Set(['popularproducts', 'popular', 'bestseller', 'top']),
      home: new Set(['home', 'household', 'homedecor']),
      lcd: new Set(['lcd', 'display', 'monitor', 'screen', 'tv']),
      airboard: new Set(['airboard', 'hoverboard', 'scooter']),
      watchs: new Set(['watchs', 'watch', 'smartwatch', 'clock']),
      charger: new Set(['charger', 'chargers', 'charging', 'power', 'adapter', 'cable']),
    };

    const tabKey = normalize(activeTab);
    const accepted = TAB_ALIASES[tabKey] || new Set([tabKey]);

    const matchesAlias = (raw) => {
      const value = normalize(raw);
      if (!value) return false;
      // direct alias match
      if (accepted.has(value)) return true;
      // substring match: "mobilecharger" should match "charger"
      for (const alias of accepted) {
        if (value.includes(alias)) return true;
      }
      return false;
    };

    const getCat = (p) =>
      p?.category ||
      p?.categoryName ||
      p?.type ||
      p?.department ||
      // also check first category object name/slug if present
      (Array.isArray(p?.categories) && (p.categories[0]?.name || p.categories[0]?.title || p.categories[0]?.slug)) ||
      'General';

    const out = products.filter((p) => matchesAlias(getCat(p)));
    // Return only matched products; if none match, show empty list for that tab
    return out;
  }, [products, activeTab]);

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 pt-2 sm:pt-4">
          <BannerSlider />
        </div>
      </section>

      {/* Random Store Based on Location - Redirect to store page */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          {normalizedStores.length > 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-[#F24E2E] mx-auto mb-3 sm:mb-4"></div>
              <p className="text-base sm:text-lg font-medium text-gray-700 mb-2">
                Redirecting to store...
              </p>
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <p className="text-base sm:text-lg font-medium text-gray-700 mb-2 px-4">
                There is no store based on the location
              </p>
              <p className="text-sm text-gray-500 mt-2 px-4">
                Please try updating your location or check back later.
              </p>
            </div>
          )}
        </div>
      </section>


    </main>
  );
}

function Section({ title, products, withTabs = false, dynamic = false, tabs = [], activeTab, onTabChange, showArrows = true }) {
  const tabsScrollRef = useRef(null);

  const scrollTabs = (dir) => {
    const el = tabsScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
        <ProductSlider title={title} products={products} openModal={() => { }} showArrows={showArrows} />
        {withTabs && (
          <div className="mt-3 sm:mt-4 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <div ref={tabsScrollRef} className="flex-1 overflow-x-auto scroll-smooth">
                <div className="min-w-max flex items-center gap-4 sm:gap-6 pr-2">
                  {(() => {
                    const defaultTabs = ['Featured', 'Popular Products', 'Game Gaged', 'Home', 'LCD', 'Air board', 'Watch\'s', 'Charger'];
                    const tabsToUse = Array.isArray(tabs) && tabs.length >= 3 ? tabs : defaultTabs;
                    return tabsToUse.map((label) => (
                      <Tab key={label} active={label === activeTab} onClick={() => onTabChange && onTabChange(label)}>
                        {label}
                      </Tab>
                    ));
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <button onClick={() => scrollTabs(-1)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-200 grid place-items-center text-slate-700 hover:bg-gray-50">
                  <ChevronLeftIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button onClick={() => scrollTabs(1)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#F24E2E] text-white grid place-items-center hover:brightness-110">
                  <ChevronRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// removed temporary BrowseProductCard; using shared ProductCard instead

function Tab({ children, active = false, onClick }) {
  return (
    <button onClick={onClick} className={`relative pb-2 text-xs sm:text-sm text-slate-700 font-medium hover:text-[#F24E2E] whitespace-nowrap ${active ? 'text-[#F24E2E]' : ''}`}>
      {children}
      {active && <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#F24E2E]"></span>}
    </button>
  );
}

function InfoCard({ icon, title, text }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
      <div className="text-xl sm:text-2xl">{icon}</div>
      <div className="mt-2 text-sm sm:text-base text-slate-900 font-medium">{title}</div>
      <div className="text-xs sm:text-sm text-gray-500">{text}</div>
    </div>
  );
}
