// src/app/products/page.jsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { FaArrowLeft } from 'react-icons/fa';
import ResponsiveText from '@/components/UI/ResponsiveText';
import TrendingProductCard from '@/components/new-design/TrendingProductCard';
import { useGetRequest } from '@/controller/getRequests';
import { getLatLngFromPostcode } from '@/controller/getLatLngFromPostcode';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useI18n } from '@/contexts/I18nContext';

// New Design Components
import Topheader from '@/components/new-design/Topheader';
import DesktopNav from '@/components/frontHeader/DesktopNav';
import BurgerMenu from '@/components/frontHeader/BurgerMenu';
import OrderCutoffBar from '@/components/new-design/OrderCutoffBar';
import Stocksection from '@/components/new-design/Stocksection';
import Filters from '@/components/new-design/Filters';
import ShopCategory from '@/components/new-design/ShopCategory';
import WarrantyCards from '@/components/new-design/WarrantyCards';
import Footer from '@/components/Footer';
import ProfileDrawer from '@/components/UI/ProfileDrawer';
import { getProductImageUrl } from '@/utils/urlHelpers';
import SectionLoader from '@/components/UI/SectionLoader';
import EmptyState from '@/components/EmptyState';
import FrontHeader from '@/components/FrontHeader';
import SharedLayout from '@/components/SharedLayout';

export default function ProductsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const deliveryMode = useSelector((state) => state.delivery.mode);
  const { token } = useSelector((state) => state.auth);
  const searchParams = useSearchParams();
  const section = (searchParams?.get('section') || '').toLowerCase();

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [personalizedData, setPersonalizedData] = useState(null);
  const [burgerOpen, setBurgerOpen] = useState(false);

  // Filters state
  const [sameDayActive, setSameDayActive] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  const {
    data: products,
    error: productsError,
    loading: productsLoading,
    sendGetRequest: getProducts,
  } = useGetRequest();

  const {
    data: flash,
    loading: flashLoading,
    sendGetRequest: getFlash,
  } = useGetRequest();

  const {
    data: campaigns,
    sendGetRequest: getCampaigns,
  } = useGetRequest();

  const fetchProductsData = useCallback(async () => {
    let lat = localStorage.getItem('lat');
    let lng = localStorage.getItem('lng');
    const categoryId = localStorage.getItem('selectedCategoryId');

    if ((!lat || !lng) && localStorage.getItem('postcode')) {
      const postcode = localStorage.getItem('postcode');
      const coords = await getLatLngFromPostcode(postcode, 'UK');
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
        localStorage.setItem('lat', lat);
        localStorage.setItem('lng', lng);
      }
    }

    const params = new URLSearchParams();
    params.set('mode', deliveryMode);

    // Integrate with new Filters component state
    if (sameDayActive) params.set('same_day', '1');

    if (activeFilters['Distance'] && activeFilters['Distance'] !== 'Any') {
      const km = activeFilters['Distance'].match(/\d+/)?.[0];
      if (km) params.set('radius', km);
    }

    if (activeFilters['Ready In'] && activeFilters['Ready In'] !== 'Any') {
      const mins = activeFilters['Ready In'] === '15 min' ? 15
        : activeFilters['Ready In'] === '30 min' ? 30
          : activeFilters['Ready In'] === '1 hour' ? 60
            : activeFilters['Ready In'] === '2 hours' ? 120 : null;
      if (mins) params.set('ready_in', mins);
    }

    if (activeFilters['Brand'] && activeFilters['Brand'] !== 'All brands') {
      params.set('brand', activeFilters['Brand']);
    }

    if (activeFilters['Storage'] && activeFilters['Storage'] !== 'Any') {
      params.set('storage', activeFilters['Storage']);
    }
    if (activeFilters['Colour'] && activeFilters['Colour'] !== 'Any') {
      params.set('colour', activeFilters['Colour']);
    }
    if (activeFilters['Condition'] && activeFilters['Condition'] !== 'Any') {
      params.set('condition', activeFilters['Condition']);
    }

    if (activeFilters['Price'] && activeFilters['Price'] !== 'Any') {
      const priceMap = {
        'Under £100': { max: 100 },
        '£100–£500': { min: 100, max: 500 },
        '£500–£1000': { min: 500, max: 1000 },
        'Over £1000': { min: 1000 },
      };
      const range = priceMap[activeFilters['Price']];
      if (range?.min) params.set('min_price', range.min);
      if (range?.max) params.set('max_price', range.max);
    }

    if (activeFilters['Sort']) {
      const sortMap = {
        'Lowest price': 'price_asc',
        'Highest price': 'price_desc',
        'Distance': 'distance',
        'Ready soon': 'ready_asc',
        'Relevance': 'relevance',
      };
      const sort = sortMap[activeFilters['Sort']];
      if (sort && sort !== 'relevance') params.set('sort', sort);
    }

    if (categoryId) {
      params.set('category_id', categoryId);
    }

    const qs = params.toString();
    const url = lat && lng
      ? `/products/getNearbyProducts?lat=${lat}&lng=${lng}&${qs}`
      : `/products/getAllProducts?${qs}`;

    await getProducts(url);
    await getFlash('/flash-sales/active');
    await getCampaigns('/campaigns/active');

    // Fetch personalized sections if needed
    if (['favorites', 'reorder', 'recommended', 'trending'].includes(section)) {
      try {
        const pParams = new URLSearchParams();
        const pcode = localStorage.getItem('postcode');
        const city = localStorage.getItem('city');
        if (pcode) pParams.append('postcode', pcode);
        if (city) pParams.append('city', city);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/personalized-feed?${pParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const result = await response.json();
          setPersonalizedData(result.data || result);
        }
      } catch (e) {
        console.error('Error fetching personalized data for View All:', e);
      }
    }
  }, [deliveryMode, sameDayActive, activeFilters, section, token, getProducts, getFlash, getCampaigns]);

  useEffect(() => {
    fetchProductsData();

    const handleRefresh = () => fetchProductsData();
    window.addEventListener('categorySelected', handleRefresh);
    window.addEventListener('filtersCleared', handleRefresh);
    window.addEventListener('locationChanged', handleRefresh);

    return () => {
      window.removeEventListener('categorySelected', handleRefresh);
      window.removeEventListener('filtersCleared', handleRefresh);
      window.removeEventListener('locationChanged', handleRefresh);
    };
  }, [fetchProductsData]);

  const handleFilterChange = (key, value) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setSameDayActive(false);
    setActiveFilters({});
    localStorage.removeItem('selectedCategoryId');
  };

  // Mark initial load as complete
  useEffect(() => {
    if (isInitialLoad && !productsLoading && products?.data) {
      setIsInitialLoad(false);
    }
  }, [productsLoading, products, isInitialLoad]);

  const getProductImage = (product) => {
    return getProductImageUrl(product);
  };

  // Process data for display
  const allProductsList = (isInitialLoad && productsLoading) ? [] : (products?.data || []);
  const flashProductsMap = (flash?.data?.products || []).reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  const productsWithFlash = allProductsList.map((p) =>
    flashProductsMap[p.id] ? { ...p, flash_price: flashProductsMap[p.id].flash_price } : p
  );

  let visibleProducts = productsWithFlash;

  // Personalized section filtering
  if (section === 'favorites' && personalizedData?.based_on_favorites) {
    visibleProducts = personalizedData.based_on_favorites;
  } else if (section === 'reorder' && personalizedData?.based_on_orders) {
    visibleProducts = personalizedData.based_on_orders;
  } else if (section === 'recommended' && personalizedData?.products) {
    visibleProducts = personalizedData.products;
  } else if (section === 'trending') {
    visibleProducts = personalizedData?.trending_nearby || productsWithFlash;
  } else if (section === 'recently-viewed') {
    const rawData = typeof window !== 'undefined' ? localStorage.getItem('recentlyViewedProductsData') : null;
    if (rawData) {
      try {
        const stored = JSON.parse(rawData);
        if (Array.isArray(stored)) {
          // Filter out products that are not in the current product list (deleted products)
          const activeProductIds = new Set(allProductsList.map(p => p.id));
          visibleProducts = stored.filter(p => activeProductIds.has(p.id));
        }
      } catch (e) { }
    }
  }

  const pageTitleLabel = section === 'best-selling' ? t('product.bestSellingProducts')
    : section === 'popular' ? t('product.popularProducts')
      : section === 'recently-viewed' ? t('product.recentlyViewed')
        : section === 'favorites' ? 'Smart Recommendations'
          : section === 'reorder' ? 'Reorder Items'
            : section === 'trending' ? 'Trending Nearby'
              : section === 'recommended' ? 'Recommended for You'
                : t('product.allProducts');

  return (
    <SharedLayout>
      <main>
        <OrderCutoffBar />
        <Stocksection />

        <Filters
          sameDayActive={sameDayActive}
          onSameDayChange={setSameDayActive}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        <ShopCategory />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
            >
              <FaArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <ResponsiveText
              as="h1"
              minSize="1.25rem"
              maxSize="1.75rem"
              className="font-bold text-[#092E3B]"
            >
              {pageTitleLabel}
              {!productsLoading && visibleProducts.length > 0 && (
                <span className="ml-3 text-sm font-normal text-gray-500">
                  ({visibleProducts.length} items found)
                </span>
              )}
            </ResponsiveText>
          </div>

          {productsLoading && isInitialLoad ? (
            <SectionLoader text="Loading products..." className="min-h-[50vh]" />
          ) : visibleProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {visibleProducts.map((product, index) => (
                <TrendingProductCard
                  key={`${product.id}-${index}`}
                  product={product}
                  image={getProductImage(product)}
                  name={product.name}
                  currentPrice={formatPrice(product.flash_price || product.price_tax_excl || product.price || 0)}
                  originalPrice={formatPrice(product.compared_price && product.compared_price > 0 ? product.compared_price : null)}
                  rating={Number(product.rating || 0)}
                  reviewCount={product.review_count || 0}
                  readyMinutes={product.ready_in_minutes}
                  productHref={`/product/${product.id}`}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No products found"
              description="We couldn't find any products matching your current filters. Please try adjusting them."
              buttonText="Clear all filters"
              buttonHref="/products"
              imageSrc="/storage/images/no-orders-yet.png"
            />
          )}
        </div>
      </main>
      <ProfileDrawer />
    </SharedLayout>
  );
}
