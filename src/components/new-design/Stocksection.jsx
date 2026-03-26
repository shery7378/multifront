'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import StockCard from './StockCard';
import { useGetRequest } from '@/controller/getRequests';
import { useCurrency } from '@/contexts/CurrencyContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function getImageUrl(product) {
  const raw =
    product?.featured_image?.url ||
    product?.base_image?.url ||
    (Array.isArray(product?.images) && product.images[0]?.url) ||
    product?.image ||
    null;
  if (!raw) return '/images/NoImageLong.jpg';
  if (raw.startsWith('http')) return raw;
  return `${API_BASE}/${raw.replace(/^\//, '')}`;
}

// Countdown timer hook
function useCountdown(endDate) {
  const calc = () => {
    if (!endDate) return null;
    const diff = new Date(endDate) - new Date();
    if (diff <= 0) return { h: 0, m: 0, s: 0 };
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    if (!endDate) return;
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return time;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function CountdownBadge({ endDate }) {
  const time = useCountdown(endDate);
  if (!time) return null;
  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-xs text-[#F44322] font-semibold">Ends in:</span>
      <span className="text-xs font-bold bg-[#F44322] text-white px-1.5 py-0.5 rounded">
        {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
      </span>
    </div>
  );
}

// Static fallback promo used while loading or when no flash sale
const STATIC_PROMO = {
  logo: '/images/new-icons/watch-apple-icon.svg',
  tagline: 'The ultimate way to watch your health.',
  seeSellersHref: '/products',
  bookDeliveryHref: '/stores',
  heroImage: '/images/new-icons/stockBanner.svg',
};

export default function Stocksection() {
  const { formatPrice } = useCurrency();
  const [refreshKey, setRefreshKey] = useState(0);

  // Flash sales fetch
  const { data: flashData, loading: flashLoading, sendGetRequest: getFlash } = useGetRequest();
  const [activeFlash, setActiveFlash] = useState(null);

  // Products fetch (for compared_price > 0 deals)
  const { data: productsData, loading: productsLoading, sendGetRequest: getProducts } = useGetRequest();

  // Cache last good data so refresh doesn't flash static banner
  const [cachedStockProducts, setCachedStockProducts] = useState([]);
  const [cachedPromo, setCachedPromo] = useState(null);

  useEffect(() => {
    getFlash('/flash-sales/active');

    // Fetch nearby products or all products
    const lat = typeof window !== 'undefined' ? localStorage.getItem('lat') : null;
    const lng = typeof window !== 'undefined' ? localStorage.getItem('lng') : null;
    if (lat && lng) {
      getProducts(`/products/getNearbyProducts?lat=${lat}&lng=${lng}&mode=delivery`);
    } else {
      getProducts('/products/getAllProducts?mode=delivery');
    }
  }, [getFlash, getProducts, refreshKey]);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  // Parse flash sale response
  useEffect(() => {
    if (!flashData) return;
    const flashSales =
      (Array.isArray(flashData) && flashData) ||
      (Array.isArray(flashData?.data) && flashData.data) ||
      (Array.isArray(flashData?.data?.flash_sales) && flashData.data.flash_sales) ||
      null;

    if (flashSales && flashSales.length > 0) {
      setActiveFlash(flashSales[0]);
    }
  }, [flashData]);

  // Flash sale products from the active sale
  const flashProducts = activeFlash?.products || [];

  // Products with compared_price > price (discounted products)
  const allProducts = productsData?.data || [];
  const discountedProducts = allProducts
    .filter((p) => Number(p.compared_price) > 0 && Number(p.compared_price) > Number(p.price))
    .slice(0, 6);

  // Merge: flash sale products first, then discounted (deduped by id)
  const flashIds = new Set(flashProducts.map((p) => p.id));
  const extraDiscounted = discountedProducts.filter((p) => !flashIds.has(p.id));
  const freshStockProducts = [...flashProducts, ...extraDiscounted].slice(0, 4);

  const heroProduct = freshStockProducts[0] || null;

  // Build fresh promo from new data
  const freshPromo = activeFlash && heroProduct
    ? {
      tagline: activeFlash.title || activeFlash.name || heroProduct.name || 'Flash Sale',
      subline: `Save big — limited time offer`,
      ctaHref: `/product/${heroProduct.id}`,
      ctaLabel: 'Shop Flash Sale',
      heroImage: getImageUrl(heroProduct),
      endDate: activeFlash.end_date || activeFlash.ends_at || null,
      bookDeliveryHref: heroProduct.store?.slug
        ? `/store/${heroProduct.store.slug}`
        : heroProduct.store_id
          ? `/store/${heroProduct.store_id}`
          : '/stores',
    }
    : heroProduct
      ? {
        tagline: heroProduct.meta_title || heroProduct.name,
        subline: heroProduct.meta_description || '',
        ctaHref: `/product/${heroProduct.id}`,
        ctaLabel: 'Shop Now',
        heroImage: getImageUrl(heroProduct),
        endDate: null,
        bookDeliveryHref: heroProduct.store?.slug
          ? `/store/${heroProduct.store.slug}`
          : heroProduct.store_id
            ? `/store/${heroProduct.store_id}`
            : '/stores',
      }
      : null;

  // Update cache whenever we have fresh non-empty results
  useEffect(() => {
    if (freshStockProducts.length > 0) setCachedStockProducts(freshStockProducts);
  }, [JSON.stringify(freshStockProducts)]);

  useEffect(() => {
    if (freshPromo) setCachedPromo(freshPromo);
  }, [JSON.stringify(freshPromo)]);

  const isLoading = flashLoading || productsLoading;

  // While loading, show cached data; once done, show fresh (or fall back to cache, then static)
  const stockProducts = isLoading ? cachedStockProducts : (freshStockProducts.length > 0 ? freshStockProducts : cachedStockProducts);
  const promo = isLoading ? cachedPromo : (freshPromo || cachedPromo);

  return (
    <section className="w-full py-8 sm:pt-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* Left: Promo banner */}
          {promo ? (
            /* ── Dynamic banner ── */
            <div className="lg:flex-2 flex flex-col bg-[#F5F5F7] rounded-[6px] overflow-hidden lg:h-[529px]">
              {/* Top: text + buttons */}
              <div className="flex flex-col items-center text-center gap-5 pt-8 px-8">
                <p className="text-[#092E3B] font-bold text-2xl md:text-[27px] leading-snug">
                  {promo.tagline}
                </p>
                <p className="text-[#585C5C] text-sm font-normal">{promo.subline}</p>

                {promo.endDate && <CountdownBadge endDate={promo.endDate} />}

                <div className="flex flex-wrap justify-center gap-[14px]">
                  <Link
                    href={promo.ctaHref}
                    className="inline-flex items-center justify-center px-5 py-2.5 lg:w-[192px] lg:h-[50px] h-[40px] rounded-[6px] bg-[#F44322] text-white font-medium text-base hover:bg-[#d63a1d] transition-colors"
                  >
                    {promo.ctaLabel}
                  </Link>
                  <Link
                    href={promo.bookDeliveryHref || '/stores'}
                    className="inline-flex items-center justify-center px-5 py-2.5 lg:w-[192px] lg:h-[50px] h-[40px] rounded-[6px] bg-[#EAEAEA] text-[#4A4A4A] font-medium text-base transition-colors"
                  >
                    Book a Delivery Slot
                  </Link>
                </div>
              </div>

              {/* Bottom: hero product image, anchored at bottom */}
              <div className="flex-1 relative min-h-[200px] mt-4">
                <Image
                  src={promo.heroImage}
                  alt={promo.tagline}
                  fill
                  unoptimized
                  className="object-contain object-bottom"
                  onError={(e) => { e.target.src = '/images/NoImageLong.jpg'; }}
                />
              </div>
            </div>
          ) : (
            /* ── Static Apple Watch fallback ── */
            <div className="lg:flex-2 flex flex-col bg-[#F5F5F7] rounded-[6px] overflow-hidden bg-[url('/images/new-icons/stockBanner.svg')] bg-cover bg-center lg:h-[529px]">
              <div className="flex flex-col sm:flex-row flex-1 p-6 sm:p-8">
                <div className="flex-1 flex flex-col justify-start gap-[22px] items-center">
                  <Image
                    src={STATIC_PROMO.logo}
                    alt="Apple"
                    width={100}
                    height={100}
                    className="w-auto h-12 object-contain"
                  />
                  <p className="text-[#092E3B] font-bold text-2xl md:text-[27px] text-center">
                    {STATIC_PROMO.tagline}
                  </p>
                  <div className="flex flex-wrap gap-[14px]">
                    <Link
                      href={STATIC_PROMO.seeSellersHref}
                      className="inline-flex items-center justify-center px-5 py-2.5 lg:w-[192px] lg:h-[50px] h-[40px] rounded-[6px] bg-[#F44322] text-white font-medium text-base hover:bg-[#d63a1d] transition-colors"
                    >
                      See Nearby Sellers
                    </Link>
                    <Link
                      href={STATIC_PROMO.bookDeliveryHref}
                      className="inline-flex items-center justify-center px-5 py-2.5 lg:w-[192px] lg:h-[50px] h-[40px] rounded-[6px] bg-[#EAEAEA] text-[#4A4A4A] font-medium text-base transition-colors"
                    >
                      Book a Delivery Slot
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right: In Stock 5 Min list */}
          <div className="lg:w-[360px] lg:shrink-0 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#092E3B] font-semibold text-base lg:text-lg">
                In Stock 5 Min
              </span>
              <button
                type="button"
                onClick={handleRefresh}
                className="flex items-center gap-1 text-[#F44322] font-normal text-sm hover:opacity-75 transition-opacity"
                title="Refresh deals"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-[114px] bg-gray-100 rounded-[6px] animate-pulse" />
                ))}
              </div>
            ) : stockProducts.length > 0 ? (
              <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
                {stockProducts.map((product) => {
                  const flashPrice = product.pivot?.flash_price || product.flash_price;
                  const basePrice = Number(product.price_tax_excl || product.price || 0);
                  const comparePrice = Number(product.compared_price || 0);

                  // Determine display price and discount
                  const displayPrice = flashPrice ? Number(flashPrice) : basePrice;
                  const originalPrice = flashPrice ? basePrice : (comparePrice > 0 ? comparePrice : null);
                  const discount = originalPrice && originalPrice > displayPrice
                    ? Math.round((1 - displayPrice / originalPrice) * 100)
                    : null;

                  return (
                    <StockCard
                      key={product.id}
                      image={getImageUrl(product)}
                      name={product.name}
                      rating={product.rating || 0}
                      distance={formatPrice(displayPrice)}
                      sellerType={
                        flashPrice
                          ? `⚡ Flash${discount ? ` -${discount}%` : ''}`
                          : discount
                            ? `-${discount}% OFF`
                            : null
                      }
                      readyInMinutes={product.ready_in_minutes || null}
                      seeSellerHref={`/product/${product.id}`}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                No deals available right now.
              </p>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
