// src/app/products/page.jsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import ResponsiveText from '@/components/UI/ResponsiveText';
import ProductCard from '@/components/ProductCard';
import { useGetRequest } from '@/controller/getRequests';
import { getLatLngFromPostcode } from '@/controller/getLatLngFromPostcode';
import SharedLayout from '@/components/SharedLayout';
import CategoryNav from '@/components/CategoryNav';
import FilterNav from '@/components/FilterNav';
import BannerSlider from '@/components/BannerSlider';
import { useI18n } from '@/contexts/I18nContext';

export default function ProductsPage() {
  const { t } = useI18n();

  const deliveryMode = useSelector((state) => state.delivery.mode);
  const searchParams = useSearchParams();
  const section = (searchParams?.get('section') || '').toLowerCase();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {
    data: products,
    error: productsError,
    loading: productsLoading,
    sendGetRequest: getProducts,
  } = useGetRequest();

  const {
    data: flash,
    error: flashError,
    loading: flashLoading,
    sendGetRequest: getFlash,
  } = useGetRequest();

  useEffect(() => {
    async function fetchProducts() {
      let lat = localStorage.getItem('lat');
      let lng = localStorage.getItem('lng');
      let price = localStorage.getItem('selectedPrice');
      const fee = localStorage.getItem('deliveryFee');
      const rating = localStorage.getItem('selectedRating');
      const sort = localStorage.getItem('selectedSortOption');
      const offersOnly = localStorage.getItem('offersOnly') === 'true';
      const maxEtaMinutes = localStorage.getItem('maxEtaMinutes');
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

      // If still no location, fetch admin default location
      if (!lat || !lng) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const response = await fetch(`${apiUrl}/api/default-location`);
          if (response.ok) {
            const data = await response.json();
            if (data.status === 200 && data.data) {
              lat = data.data.default_location_latitude;
              lng = data.data.default_location_longitude;
              console.log('✅ Using admin default location:', { lat, lng });
              localStorage.setItem('lat', lat.toString());
              localStorage.setItem('lng', lng.toString());
            }
          }
        } catch (error) {
          console.error('Error fetching default location:', error);
        }
      }

      const modeParam = `mode=${deliveryMode}`;
      let url = '';

      // Always use location-based endpoint if we have coordinates (user or admin default)
      if (lat && lng) {
        url = `/products/getNearbyProducts?lat=${lat}&lng=${lng}&${modeParam}`;
      } else {
        url = `/products/getAllProducts?${modeParam}`;
      }

      if (price && price !== '6') {
        const priceValue = Number(price);
        if (!isNaN(priceValue) && priceValue >= 1 && priceValue <= 5) {
          url += `&max_price=${priceValue * 10}`;
        }
      }
      if (fee && fee !== '6') {
        url += `&max_delivery_fee=${fee}`;
      }
      if (rating) {
        url += `&min_rating=${rating}`;
      }
      // Category filter is supported by the Product API controller.
      if (categoryId) {
        url += `&category_id=${categoryId}`;
      }
      if (offersOnly) {
        url += `&has_offers=true`;
      }
      if (maxEtaMinutes) {
        url += `&max_eta=${maxEtaMinutes}`;
      }
      if (sort) {
        const sortMap = {
          'Recommended': 'recommended',
          'Rating': 'rating_desc',
          'Earliest arrival': 'eta_asc',
        };
        const sortKey = sortMap[sort] || 'recommended';
        url += `&sort=${sortKey}`;
      }

      await getProducts(url);
      await getFlash('/flash-sales/active');
    }

    fetchProducts();

    const handlePriceFilter = () => fetchProducts();
    const handleDeliveryFee = () => fetchProducts();
    const handleRating = () => fetchProducts();
    const handleSort = () => fetchProducts();
    const handleOffers = () => fetchProducts();
    const handleTime = () => fetchProducts();
    const handleClearAll = () => fetchProducts();
    const handleCategory = () => fetchProducts();
    window.addEventListener('priceFilterApplied', handlePriceFilter);
    window.addEventListener('deliveryFeeApplied', handleDeliveryFee);
    window.addEventListener('ratingFilterApplied', handleRating);
    window.addEventListener('sortApplied', handleSort);
    window.addEventListener('offersToggled', handleOffers);
    window.addEventListener('timeFilterApplied', handleTime);
    window.addEventListener('filtersCleared', handleClearAll);
    window.addEventListener('categorySelected', handleCategory);
    window.addEventListener('dietaryFilterApplied', handleDietary);
    return () => {
      window.removeEventListener('priceFilterApplied', handlePriceFilter);
      window.removeEventListener('deliveryFeeApplied', handleDeliveryFee);
      window.removeEventListener('ratingFilterApplied', handleRating);
      window.removeEventListener('sortApplied', handleSort);
      window.removeEventListener('offersToggled', handleOffers);
      window.removeEventListener('timeFilterApplied', handleTime);
      window.removeEventListener('filtersCleared', handleClearAll);
      window.removeEventListener('categorySelected', handleCategory);
    };
  }, [deliveryMode]);

  // Mark initial load as complete once products are loaded
  useEffect(() => {
    if (isInitialLoad && !productsLoading && products?.data) {
      setIsInitialLoad(false);
    }
  }, [productsLoading, products, isInitialLoad]);

  // Use empty array during initial load, otherwise use products data
  const allProducts = (isInitialLoad && productsLoading) ? [] : (products?.data || []);
  const flashProducts = (flash?.data?.products || []).reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});
  const productsWithFlash = allProducts.map((p) =>
    flashProducts[p.id] ? { ...p, flash_price: flashProducts[p.id].flash_price } : p
  );

  // Create flash sales banners from products with flash prices
  const flashSalesBanners = useMemo(() => {
    if (!flash?.data?.products || !Array.isArray(flash.data.products) || flash.data.products.length === 0) {
      return [];
    }

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

    return flash.data.products.slice(0, 8).map((p) => {
      const basePrice = Number(p?.price || p?.price_tax_incl || p?.price_tax_excl || 0);
      const flashPrice = Number(p?.flash_price || 0);
      const comparePrice = basePrice;
      const effectivePrice = flashPrice > 0 ? flashPrice : basePrice;
      const percent = basePrice > 0 && flashPrice > 0 && flashPrice < basePrice
        ? Math.round(((basePrice - flashPrice) / basePrice) * 100)
        : 0;

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
        message: percent > 0 ? `${percent}% OFF` : 'Flash Sale',
        price: effectivePrice,
        comparePrice: comparePrice,
        _productId: p?.id,
      };
    });
  }, [flash?.data?.products]);

  // Client-side filter fallbacks: if the API doesn't apply filters correctly,
  // we still try to filter on the client side.
  let visibleProducts = productsWithFlash;
  try {
    if (typeof window !== 'undefined') {
      // Price filter fallback
      const priceSel = localStorage.getItem('selectedPrice');
      const maxPrice = priceSel && priceSel !== '6' ? Number(priceSel) * 10 : null;
      if (maxPrice) {
        visibleProducts = visibleProducts.filter((p) => {
          // Use flash_price if available, otherwise use regular price
          const productPrice = Number(p?.flash_price ?? p?.price ?? p?.final_price ?? p?.unit_price ?? 0);
          return productPrice > 0 && productPrice <= maxPrice;
        });
      }

      const categoryId = localStorage.getItem('selectedCategoryId');
      const categoryName = localStorage.getItem('selectedCategoryName');

      if (categoryId || categoryName) {
        const normalize = (v) =>
          (v || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

        const anyHasCategory = visibleProducts.some((p) => {
          return (
            p?.category_id != null ||
            p?.categoryId != null ||
            (p?.category && p?.category?.id != null) ||
            Array.isArray(p?.categories)
          );
        });

        if (anyHasCategory) {
          visibleProducts = visibleProducts.filter((p) => {
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
    }
  } catch {
    // ignore category filter errors
  }

  // Handle recently-viewed section
  if (section === 'recently-viewed') {
    try {
      const dataKey = 'recentlyViewedProductsData';
      const rawData = typeof window !== 'undefined' ? localStorage.getItem(dataKey) : null;
      
      if (rawData) {
        try {
          const storedProducts = JSON.parse(rawData);
          if (Array.isArray(storedProducts) && storedProducts.length > 0) {
            const validProducts = storedProducts.filter(p => p && p.id && p.name);
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
                
                console.log('📍 Location filtering (products page):', {
                  before: validProducts.length,
                  after: locationFilteredProducts.length,
                  availableProducts: allProducts.length
                });
                
                if (locationFilteredProducts.length > 0) {
                  // Merge with flash prices if available
                  const productsWithFlashPrices = locationFilteredProducts.map(p => {
                    const flashPrice = flashProducts[p.id]?.flash_price;
                    return flashPrice ? { ...p, flash_price: flashPrice } : p;
                  });
                  visibleProducts = productsWithFlashPrices;
                  console.log('📦 Showing recently viewed products (location filtered):', visibleProducts.length);
                } else {
                  console.log('📍 No recently viewed products available in selected location');
                  visibleProducts = []; // Clear if no products match location
                }
              } else {
                console.log('⏳ Products not loaded yet, not showing recently viewed until products load');
                visibleProducts = []; // Don't show until products are loaded so we can filter by location
              }
            }
          }
        } catch (e) {
          console.error('Error parsing recently viewed products:', e);
        }
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  }

  // Basic section-based filtering if needed later; currently shows all
  const pageTitle = section === 'best-selling'
    ? t('product.bestSellingProducts')
    : section === 'popular'
    ? t('product.popularProducts')
    : section === 'recently-viewed'
    ? t('product.recentlyViewed')
    : t('product.allProducts');

  // Only show loading state on initial load, not when filters change
  if (isInitialLoad && (productsLoading || flashLoading)) {
    return <p>{t('common.loadingProducts')}</p>;
  }
  if (productsError) return <p>{t('common.error')}: {productsError}</p>;
  if (flashError) return <p>{t('common.error')}: {flashError}</p>;

  return (
    <SharedLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <div className="banner-slider mb-4">
          <BannerSlider 
            items={flashSalesBanners}
            maxItems={8}
            autoPlayInterval={5000}
          />
        </div>
        <div className="categories mb-4">
          <div className="flex flex-nowrap justify-start">
            <CategoryNav />
          </div>
        </div>

        <div className="filter-nav mb-4">
          <div className="flex flex-nowrap justify-start">
            <FilterNav />
          </div>
        </div>

        <div className="flex justify-between items-baseline mb-4">
          <ResponsiveText
            as="h1"
            minSize="1.125rem"
            maxSize="1.5rem"
            className="font-semibold text-oxford-blue"
          >
            {pageTitle}
          </ResponsiveText>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {visibleProducts.map((product, index) => (
            <ProductCard
              key={`${product?.id || product?.name || index}-${index}`}
              product={product}
              index={index}
              isFavorite={false}
              toggleFavorite={() => {}}
              onPreviewClick={() => {}}
              productModal={() => {}}
            />)
          )}
        </div>
      </div>
    </SharedLayout>
  );
}
