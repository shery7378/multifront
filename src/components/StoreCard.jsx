'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import SpeedBadge from './SpeedBadge';
import { storeFavorites } from '@/utils/favoritesApi';
import { useSelector } from 'react-redux';

export default function StoreCard({
  index = 0,
  name = 'Store',
  id = undefined,
  slug = '#',
  rating = 0,
  deliveryTime = '',
  prepTime = '', // Preparation time for pickup
  offer = '',
  award = '',
  choice = '',
  cuisine = '',
  note = '',
  logo = '',
  user_id = null, // Vendor user ID for contact
  offersPickup = false,
  offersDelivery = false,
  isOpen = null, // Store open status (true/false/null)
}) {
  const href = (typeof slug === 'string' && slug) ? `/store/${slug}` : (id ? `/store/${id}` : '#');
  const favKey = String(id ?? slug ?? name);
  const [isFavorite, setIsFavorite] = useState(false);
  const { token } = useSelector((state) => state.auth);

  // --- Dynamic rating state (fetched from /stores/{id}/rating and cached) ---
  const initialRating = Number(rating ?? 0) || 0;
  const [ratingData, setRatingData] = useState({
    rating: initialRating,
    reviewCount: 0,
  });

  useEffect(() => {
    const storeId = id || slug;
    if (!storeId) return;

    // Use initial rating if provided
    if (initialRating > 0) {
      setRatingData(prev => ({ ...prev, rating: initialRating }));
      // Still fetch in background to get reviewCount if needed, or skip if we trust initial
      // For now, let's keep fetching but check cache first. 
      // Actually, if we have initialRating, we might just want to use it to show *something* immediately.
      // But if we want to skip fetch for performance, we should return if initialRating is good enough.
    }

    // Optimization: If we have a rating > 0 passed in props, we can likely skip the fetch 
    // UNLESS we really need the reviewCount which might not be in the initial prop.
    // However, the backend now includes avg_rating in the store object.
    // If the prop `rating` comes from the store object, it is the live average.

    // Only fetch if we don't have a rating or if we want review count specifically
    // But since the user complained about slowness, let's rely on props if available.
    if (rating > 0 && typeof window !== 'undefined' && !window.__storeRatingCache?.[String(storeId)]) {
      // Cache the prop value immediately
      window.__storeRatingCache = window.__storeRatingCache || {};
      window.__storeRatingCache[String(storeId)] = { rating: initialRating, reviewCount: 0 }; // We don't have reviewCount yet but rating is key
    }

    // Simple in-memory cache on window to avoid refetching per card
    if (typeof window !== 'undefined') {
      const cache = window.__storeRatingCache || {};
      const cacheKey = String(storeId);
      if (cache[cacheKey]) {
        setRatingData(cache[cacheKey]);
        return;
      }
    }

    let cancelled = false;
    async function fetchRating() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        if (!apiBase) return;

        console.log(`⭐ [StoreCard] Fetching rating for ${storeId} from ${apiBase}/api/stores/${storeId}/rating`);

        const res = await fetch(`${apiBase}/api/stores/${storeId}/rating`, {
          headers: { Accept: 'application/json' },
        });

        console.log(`⭐ [StoreCard] Response status: ${res.status}`);

        if (!res.ok) {
          console.error(`❌ [StoreCard] Failed to fetch rating: ${res.status} ${res.statusText}`);
          return;
        }

        const json = await res.json();
        console.log(`⭐ [StoreCard] Data:`, json);

        // Use average_review_rating or bayesian_rating, fallback to average_rating
        const avg = Number(
          json?.data?.average_review_rating ??
          json?.data?.bayesian_rating ??
          json?.data?.average_rating ??
          0
        ) || 0;
        const count = Number(json?.data?.review_count ?? 0) || 0;
        const normalized = { rating: avg, reviewCount: count };

        if (!cancelled) {
          setRatingData(normalized);
        }
        if (typeof window !== 'undefined') {
          const cacheKey = String(storeId);
          window.__storeRatingCache = {
            ...(window.__storeRatingCache || {}),
            [cacheKey]: normalized,
          };
        }
      } catch (err) {
        console.error('❌ [StoreCard] Fetch error:', err);
        // fail silently; keep initial rating
      }
    }

    fetchRating();
    return () => {
      cancelled = true;
    };
  }, [id, slug]);

  useEffect(() => {
    const refresh = async () => {
      // If user is logged in, fetch from backend API
      if (token && id) {
        try {
          const favoriteIds = await storeFavorites.getAll();
          const favoriteSet = new Set(favoriteIds.map(favId => String(favId)));
          setIsFavorite(favoriteSet.has(String(id)));
        } catch (error) {
          console.error('❌ [StoreCard] Error loading favorites from API:', error);
          // Fallback to localStorage
          try {
            const saved = JSON.parse(localStorage.getItem('favoriteStores') || '{}');
            const idKey = id != null ? String(id) : null;
            const slugKey = slug ? String(slug) : null;
            const active = saved[favKey] || (idKey && saved[idKey]) || (slugKey && saved[slugKey]);
            setIsFavorite(!!active);
          } catch { }
        }
      } else {
        // If not logged in, check localStorage only
        try {
          const saved = JSON.parse(localStorage.getItem('favoriteStores') || '{}');
          const idKey = id != null ? String(id) : null;
          const slugKey = slug ? String(slug) : null;
          const active = saved[favKey] || (idKey && saved[idKey]) || (slugKey && saved[slugKey]);
          setIsFavorite(!!active);
        } catch { }
      }
    };

    refresh();

    if (typeof window !== 'undefined') {
      const handleFavoriteStoresUpdated = () => refresh();
      const handleUserLoggedIn = () => {
        console.log('🔐 [StoreCard] User logged in, reloading favorites');
        refresh();
      };

      window.addEventListener('favoriteStoresUpdated', handleFavoriteStoresUpdated);
      window.addEventListener('userLoggedIn', handleUserLoggedIn);
      const storageHandler = (e) => { if (e.key === 'favoriteStores') refresh(); };
      window.addEventListener('storage', storageHandler);

      return () => {
        window.removeEventListener('favoriteStoresUpdated', handleFavoriteStoresUpdated);
        window.removeEventListener('userLoggedIn', handleUserLoggedIn);
        window.removeEventListener('storage', storageHandler);
      };
    }
  }, [favKey, id, slug, token]);

  const toggleFavoriteStore = async () => {
    if (!id) return;

    const wasFavorite = isFavorite;

    try {
      // Update UI immediately (optimistic update)
      setIsFavorite(!wasFavorite);

      // Save to database (with localStorage fallback)
      if (wasFavorite) {
        await storeFavorites.remove(id);
        console.log('❌ [StoreCard] Removed favorite from database:', { storeId: id });
      } else {
        await storeFavorites.add(id);
        console.log('✅ [StoreCard] Added favorite to database:', { storeId: id });
      }

      // Also update localStorage as backup
      try {
        const saved = JSON.parse(localStorage.getItem('favoriteStores') || '{}');
        const idKey = id != null ? String(id) : null;
        const slugKey = slug ? String(slug) : null;

        if (wasFavorite) {
          delete saved[favKey];
          if (idKey) delete saved[idKey];
          if (slugKey) delete saved[slugKey];
        } else {
          saved[favKey] = true;
          if (idKey) saved[idKey] = true;
          if (slugKey) saved[slugKey] = true;
        }
        localStorage.setItem('favoriteStores', JSON.stringify(saved));
      } catch { }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('favoriteStoresUpdated'));
      }
    } catch (err) {
      console.error('❌ [StoreCard] Error toggling favorite:', err);
      // Revert UI on error
      setIsFavorite(wasFavorite);
    }
  };

  const logoUrl = (() => {
    if (!logo) return '/images/NoImageLong.jpg';
    const raw = (typeof logo === 'object' && logo !== null) ? (logo.url || logo.path || '') : logo;
    if (!raw) return '/images/NoImageLong.jpg';
    const s = String(raw);
    return s.startsWith('http') ? s : `${process.env.NEXT_PUBLIC_API_URL || ''}/${s}`;
  })();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 relative group hover:shadow-md transition-shadow duration-300">
      {/* Cover Link - Makes whole card clickable */}
      <Link href={href} className="absolute inset-0 z-10" aria-label={`Visit ${name}`} />

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavoriteStore();
        }}
        className={`absolute top-2 right-2 w-9 h-9 rounded-full border bg-white flex items-center justify-center transition ${isFavorite ? 'border-vivid-red' : 'border-gray-200'} hover:border-vivid-red hover:shadow-[0_0_6px_#ef4444] z-20`}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isFavorite ? (
          <FaHeart className="text-vivid-red" />
        ) : (
          <FaRegHeart className="text-gray-600" />
        )}
      </button>

      {/* Content wrapper - separate from Link to avoid nesting, but visually identical */}
      <div className="block">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={name} className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate group-hover:text-vivid-red transition-colors">{name}</div>
            <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1">
                ⭐ {Number(ratingData.rating || 0).toFixed(1)}
                {ratingData.reviewCount > 0 && (
                  <span className="ml-1">({ratingData.reviewCount})</span>
                )}
              </span>
              {deliveryTime ? (<><span>•</span><span>{deliveryTime}</span></>) : null}
              {isOpen !== null && isOpen !== undefined && (
                <>
                  <span>•</span>
                  <span className={isOpen ? 'text-green-600' : 'text-gray-500'}>
                    {isOpen ? 'Open now' : 'Closed'}
                  </span>
                </>
              )}
            </div>
            {/* Speed Badges */}
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              {offersPickup && prepTime && (
                <SpeedBadge prepTime={prepTime} mode="pickup" />
              )}
              {offersDelivery && deliveryTime && (
                <SpeedBadge deliveryTime={deliveryTime} mode="delivery" />
              )}
            </div>
            {(offer || award || choice || cuisine || note) && (
              <div className="mt-1 text-[11px] text-[#F24E2E] line-clamp-1">
                {[offer, award, choice, cuisine, note].filter(Boolean).join(' • ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Vendor Button - explicit z-index to sit above the cover link */}
      {user_id ? (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('💬 Contact Vendor clicked for user_id:', user_id);
            // Trigger Daraz chat widget to open with vendor
            const event = new CustomEvent('openVendorChat', {
              detail: { vendorId: user_id }
            });
            window.dispatchEvent(event);
          }}
          className="mt-2 w-full bg-vivid-red hover:bg-red-700 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-sm relative z-20"
          style={{ backgroundColor: '#ef4444' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Contact Vendor
        </button>
      ) : (
        <div className="mt-2 text-xs text-gray-400 text-center py-2 border border-gray-200 rounded-md bg-gray-50 relative z-20">
          No vendor ID available
        </div>
      )}
    </div>
  );
}
