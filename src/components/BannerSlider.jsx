//src/components/BannerSlider.jsx
"use client"; // Marks this as a Client Component

import React, { useState, useEffect, useRef } from 'react';
import { useGetRequest } from '@/controller/getRequests';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function BannerSlider({
  endpoint = '/campaigns/active',
  channel = 'in_app',
  status = undefined, // e.g., 'active' | 'scheduled'
  maxItems = 8,
  autoPlayInterval = 5000,
  onBannerClick,
  /**
   * Optional precomputed banner items.
   * When provided (non-empty array), the slider will use these items directly
   * instead of fetching campaigns from the API.
   * Shape: { image: string; url?: string | null; title?: string; message?: string; [_key: string]: any }
   */
  items,
} = {}) {
  const { data, error, loading, sendGetRequest } = useGetRequest();
  const [campaignBanners, setCampaignBanners] = useState([]);
  const { formatPrice } = useCurrency();

  const [currentIndex, setCurrentIndex] = useState(0); // Start at first
  const [visibleSlides, setVisibleSlides] = useState(4); // Default to 4 visible slides (desktop)
  const transitionDuration = 500; // Duration of the transition in milliseconds
  const sliderRef = useRef(null);

  // Function to determine the number of visible slides based on screen width
  const updateVisibleSlides = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) {
        setVisibleSlides(1); // Mobile: 1 slide
      } else if (width < 1024) {
        setVisibleSlides(2); // Tablet: 2 slides
      } else if (width < 1280) {
        setVisibleSlides(3); // Small desktop: 3 slides
      } else {
        setVisibleSlides(4); // Large desktop: 4 slides
      }
    }
  };

  const renderPriceLine = (banner) => {
    const isProductBanner = Boolean(banner?._productId);
    if (!isProductBanner) return null;

    const price = Number(banner?.price ?? 0);
    const compare = Number(banner?.comparePrice ?? 0);
    if (!Number.isFinite(price) || price <= 0) return null;

    const hasCompare = Number.isFinite(compare) && compare > price;

    return (
      <div className="mt-0.5 flex items-baseline gap-2 text-[11px] sm:text-xs">
        <span className="font-bold text-[#F24E2E]">
          {formatPrice(price)}
        </span>
        {hasCompare && (
          <>
            <span className="line-through opacity-80">
              {formatPrice(compare)}
            </span>
            {banner.message && (
              <span className="ml-1 inline-flex items-center rounded-full bg-[#F24E2E] px-2 py-[2px] text-[10px] sm:text-[11px] font-semibold">
                {banner.message}
              </span>
            )}
          </>
        )}
      </div>
    );
  };


  // Load campaigns and set initial visible slides
  useEffect(() => {
    updateVisibleSlides();
    // If caller passed explicit items, use them and skip API call
    // Check if items is defined, even if empty array, to assert control
    if (Array.isArray(items)) {
      const limitedItems =
        maxItems && Number.isFinite(maxItems) ? items.slice(0, maxItems) : items;
      setCampaignBanners(limitedItems);
    } else {
      if (!endpoint) return; // Skip fetching if no endpoint is provided
      // build endpoint from props
      const params = new URLSearchParams();
      if (channel) params.set('channel', channel);
      if (status) params.set('status', status);
      const finalEndpoint = `${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
      if (typeof window !== 'undefined') {
        console.log('[BannerSlider] GET endpoint:', finalEndpoint);
      }
      sendGetRequest(finalEndpoint);
    }
    window.addEventListener('resize', updateVisibleSlides);
    return () => window.removeEventListener('resize', updateVisibleSlides);
  }, [sendGetRequest, endpoint, channel, status, items, maxItems]);

  // Map campaigns to banners when data arrives
  useEffect(() => {
    // If items were provided, do not override them with API data
    if (Array.isArray(items)) {
      return;
    }
    try {
      if (typeof window !== 'undefined') {
        console.log('[BannerSlider] raw data:', data, 'loading:', loading, 'error:', error);
      }
      // Support multiple common API shapes (ensure array)
      const root =
        (Array.isArray(data?.data?.campaigns) && data.data.campaigns)
        || (Array.isArray(data?.campaigns) && data.campaigns)
        || (Array.isArray(data?.data?.data?.campaigns) && data.data.data.campaigns)
        || (Array.isArray(data?.data) && data.data)
        || [];

      if (typeof window !== 'undefined') {
        console.log('[BannerSlider] campaigns root len:', Array.isArray(root) ? root.length : 0);
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const toAbsolute = (img) => {
        if (!img) return '';
        // If it's already an absolute URL or a base64 data URI, return as is
        if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) {
          return img;
        }
        if (apiBase) {
          if (img.startsWith('/')) return `${apiBase}${img}`;
          // handle paths like "storage/.." (no leading slash)
          return `${apiBase}/${img}`;
        }
        return img; // fallback
      };

      const mapped = (Array.isArray(root) ? root : []).map((c) => {
        const target = typeof c?.target === 'string'
          ? (() => { try { return JSON.parse(c.target); } catch { return {}; } })()
          : (c?.target || {});

        const imageRaw =
          c?.image || // Direct image field from campaign (PRIORITY)
          target.image_url || target.imageUrl || target.image || target.banner || target.banner_url || target.bannerUrl ||
          c?.image_url || c?.imageUrl || c?.banner_url || c?.bannerUrl || c?.banner || c?.thumbnail ||
          c?.media?.url || c?.media?.original_url || c?.media?.path || c?.meta?.image || c?.meta?.banner || c?.assets?.image || null;

        const image = imageRaw ? toAbsolute(imageRaw) : '/images/NoImageLong.jpg';
        const url = target.url || target.href || c?.url || c?.link || c?.target_url || null;
        const title = c?.title || c?.name || target?.title || '';
        const message = c?.message || c?.description || target?.message || '';

        // Debug log for each campaign
        if (typeof window !== 'undefined' && c) {
          console.log('[BannerSlider] Campaign mapping:', {
            id: c.id,
            title,
            message,
            imageRaw,
            finalImage: image,
            url
          });
        }

        return { image, url, title, message, _isCampaign: true };
      });

      if (typeof window !== 'undefined') {
        // temporary debug to verify mapping
        console.log('[BannerSlider] mapped campaign banners:', mapped);
      }

      const finalBanners = (mapped.length === 0 && Array.isArray(root) && root.length > 0)
        ? root.map((c) => ({
          image: 'https://via.placeholder.com/1200x300?text=Campaign',
          url: null,
          title: c?.title || c?.name || '',
          message: c?.message || c?.description || '',
          _isCampaign: true,
        }))
        : mapped;

      const limited = maxItems && Number.isFinite(maxItems) ? finalBanners.slice(0, maxItems) : finalBanners;
      if (typeof window !== 'undefined') {
        console.log('[BannerSlider] final banners len:', limited.length);
      }
      setCampaignBanners(limited);
    } catch {
      setCampaignBanners([]);
    }
  }, [data, items, maxItems, loading, error]);

  // When campaign banners load, reset index to new banners length
  useEffect(() => {
    const len = campaignBanners.length;
    if (len > 0) setCurrentIndex(len);
  }, [campaignBanners]);

  // Final banner sources: campaigns only
  const banners = campaignBanners;
  // Calculate slide width percentage based on effective visible slides (do not exceed banners length)
  const effectiveVisibleSlides = Math.max(1, Math.min(visibleSlides, Math.max(1, banners.length)));
  const slideWidthPercentage = 100 / effectiveVisibleSlides;
  // Duplicate the banners multiple times to ensure smooth looping
  const extendedBanners = [...banners, ...banners, ...banners]; // Repeat 3 times for smooth looping
  const totalSlides = extendedBanners.length;

  // Note: do not early-return before hooks; keep hook order stable across renders

  // Auto-slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        return prevIndex + 1;
      });
    }, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlayInterval]);

  // Handle transition end to reset the index for infinite loop
  const handleTransitionEnd = () => {
    if (!sliderRef.current) return;

    if (currentIndex >= banners.length * 2) {
      // Reached end of 3rd set — jump back to middle set
      sliderRef.current.style.transition = 'none';
      setCurrentIndex(banners.length);
      // Trigger reflow
      sliderRef.current.getBoundingClientRect();
      // Re-enable transition
      setTimeout(() => {
        if (sliderRef.current) {
          sliderRef.current.style.transition = `transform ${transitionDuration}ms ease-in-out`;
        }
      }, 50);
    }
  };

  // Don't render if there are no banners and not loading
  // This prevents showing empty space when campaigns are not available
  // If items prop is provided (external control), we respect its emptiness immediately (assuming parent handles loading)
  if (banners.length === 0) {
    if (Array.isArray(items)) return null;
    if (!loading) return null;
  }

  return (
    <div className="relative w-full h-[160px] sm:h-[180px] lg:h-[190px] overflow-hidden">
      <div
        ref={sliderRef}
        className="flex h-full gap-2 sm:gap-3 lg:gap-4"
        style={{
          transform: `translateX(-${currentIndex * slideWidthPercentage}%)`,
          transition: `transform ${transitionDuration}ms ease-in-out`,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extendedBanners.map((banner, index) => {
          const isProductBanner = Boolean(banner?._productId);
          const baseImgClasses = isProductBanner
            ? 'w-full h-full object-contain object-center bg-white'
            : 'w-full h-full object-fill object-center';

          return (
            <div
              key={index}
              className={`flex-shrink-0`} // Width controlled via inline style for precise sliding
              style={{ width: `${slideWidthPercentage}%` }}
            >
              <div className={`relative w-full h-full rounded-lg overflow-hidden shadow-sm ${isProductBanner ? 'bg-gradient-to-r from-slate-50 to-slate-100' : ''}`}>
                {banner.url ? (
                  <a href={banner.url} onClick={(e) => { if (onBannerClick) { onBannerClick(banner, e); } }}>
                    <img
                      src={banner.image}
                      alt={`Banner ${index + 1}`}
                      className={baseImgClasses}
                      onError={(e) => { if (!e.currentTarget.dataset.fallbackApplied) { e.currentTarget.dataset.fallbackApplied = '1'; e.currentTarget.src = '/images/NoImageLong.jpg'; } }}
                    />
                  </a>
                ) : (
                  <img
                    src={banner.image}
                    alt={`Banner ${index + 1}`}
                    className={baseImgClasses}
                    onError={(e) => { if (!e.currentTarget.dataset.fallbackApplied) { e.currentTarget.dataset.fallbackApplied = '1'; e.currentTarget.src = '/images/NoImageLong.jpg'; } }}
                  />
                )}
                <div className="absolute inset-0 pointer-events-none flex items-end">
                  {(banner.title || banner.message) && (
                    <div className="w-full bg-gradient-to-t from-black/60 to-transparent text-white p-3 text-xs sm:text-sm">
                      <div className="font-semibold truncate">{banner.title}</div>
                      {isProductBanner
                        ? renderPriceLine(banner)
                        : banner.message && (
                          <div className="opacity-90 truncate">
                            {banner.message}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}