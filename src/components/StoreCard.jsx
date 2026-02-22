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
  banner = '', // Banner image URL
  offersPickup = false,
  offersDelivery = false,
  isOpen = null, // Store open status (true/false/null)
}) {
  const href = (typeof slug === 'string' && slug) ? `/store/${slug}` : (id ? `/store/${id}` : '#');
  const favKey = String(id ?? slug ?? name);
  const [isFavorite, setIsFavorite] = useState(false);
  const { token } = useSelector((state) => state.auth);

  // --- Dynamic rating state ---
  const initialRating = Number(rating ?? 0) || 0;
  const [ratingData, setRatingData] = useState({
    rating: initialRating,
    reviewCount: 0,
  });

  // (Existing useEffect logic for rating and favorites remains the same...)
  useEffect(() => {
    const storeId = id || slug;
    if (!storeId) return;

    if (initialRating > 0 && typeof window !== 'undefined' && !window.__storeRatingCache?.[String(storeId)]) {
      window.__storeRatingCache = window.__storeRatingCache || {};
      window.__storeRatingCache[String(storeId)] = { rating: initialRating, reviewCount: 0 };
    }

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
        const res = await fetch(`${apiBase}/api/stores/${storeId}/rating`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return;
        const json = await res.json();
        const avg = Number(json?.data?.average_review_rating ?? json?.data?.bayesian_rating ?? json?.data?.average_rating ?? 0) || 0;
        const count = Number(json?.data?.review_count ?? 0) || 0;
        const normalized = { rating: avg, reviewCount: count };
        if (!cancelled) setRatingData(normalized);
        if (typeof window !== 'undefined') {
          const cacheKey = String(storeId);
          window.__storeRatingCache = { ...(window.__storeRatingCache || {}), [cacheKey]: normalized };
        }
      } catch (err) { console.error('❌ [StoreCard] Fetch error:', err); }
    }
    fetchRating();
    return () => { cancelled = true; };
  }, [id, slug, initialRating]);

  useEffect(() => {
    const refresh = async () => {
      if (token && id) {
        try {
          const favoriteIds = await storeFavorites.getAll();
          const favoriteSet = new Set(favoriteIds.map(favId => String(favId)));
          setIsFavorite(favoriteSet.has(String(id)));
        } catch (error) {
          try {
            const saved = JSON.parse(localStorage.getItem('favoriteStores') || '{}');
            const idKey = id != null ? String(id) : null;
            const slugKey = slug ? String(slug) : null;
            const active = saved[favKey] || (idKey && saved[idKey]) || (slugKey && saved[slugKey]);
            setIsFavorite(!!active);
          } catch { }
        }
      } else {
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
      window.addEventListener('favoriteStoresUpdated', handleFavoriteStoresUpdated);
      const storageHandler = (e) => { if (e.key === 'favoriteStores') refresh(); };
      window.addEventListener('storage', storageHandler);
      return () => {
        window.removeEventListener('favoriteStoresUpdated', handleFavoriteStoresUpdated);
        window.removeEventListener('storage', storageHandler);
      };
    }
  }, [favKey, id, slug, token]);

  const toggleFavoriteStore = async () => {
    if (!id) return;
    const wasFavorite = isFavorite;
    try {
      setIsFavorite(!wasFavorite);
      if (wasFavorite) await storeFavorites.remove(id); else await storeFavorites.add(id);
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
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('favoriteStoresUpdated'));
    } catch (err) { setIsFavorite(wasFavorite); }
  };

  const logoUrl = (() => {
    if (!logo) return null;
    const raw = (typeof logo === 'object' && logo !== null) ? (logo.url || logo.path || '') : logo;
    if (!raw) return null;
    const s = String(raw);
    return s.startsWith('http') ? s : `${process.env.NEXT_PUBLIC_API_URL || ''}/${s}`;
  })();

  const bannerUrl = (() => {
    if (!banner) return null;
    const s = String(banner);
    return s.startsWith('http') ? s : `${process.env.NEXT_PUBLIC_API_URL || ''}/${s}`;
  })();

  const displayImage = logoUrl || bannerUrl || '/images/NoImageLong.jpg';

  return (
    <div className="relative group bg-white border border-[#E6EAED] rounded-[6px] overflow-hidden transition-all hover:bg-gray-50 flex flex-col sm:flex-row min-h-[150px]">
      {/* 1. Image area (Left on desktop) */}
      <Link href={href} className="relative w-full sm:w-[130px] md:w-[150px] shrink-0 bg-gray-50 overflow-hidden min-h-[120px] sm:min-h-0">
        <img 
          src={displayImage} 
          alt={name} 
          className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" 
          onError={(e) => { e.target.src = '/images/NoImageLong.jpg'; }}
        />
        {/* Status Badge Overlay */}
        {isOpen !== null && (
          <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase z-10 ${isOpen ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
            {isOpen ? 'Open' : 'Closed'}
          </div>
        )}
      </Link>

      {/* 2. Content area (Right on desktop) */}
      <div className="flex-1 flex flex-col p-3 pr-4">
        <div className="flex justify-between items-start gap-2">
          <Link href={href} className="flex-1 min-w-0">
            <h3 className="text-[#2E3333] font-semibold text-base leading-tight line-clamp-1 group-hover:text-vivid-red transition-colors">
              {name}
            </h3>
          </Link>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavoriteStore();
            }}
            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-gray-100 ${isFavorite ? 'text-vivid-red' : 'text-gray-400'}`}
          >
            {isFavorite ? <FaHeart className="w-4 h-4" /> : <FaRegHeart className="w-4 h-4" />}
          </button>
        </div>

        {/* Rating & Distance */}
        <div className="flex items-center gap-1.5 text-[#585C5C] text-sm mt-1 flex-wrap">
          <div className="flex items-center gap-0.5 text-[#4D7C1B] font-bold">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            <span>{Number(ratingData.rating || 0).toFixed(1)}</span>
          </div>
          {ratingData.reviewCount > 0 && <span className="text-gray-400 text-xs">({ratingData.reviewCount})</span>}
          {cuisine && (
            <>
              <span className="text-gray-300">•</span>
              <span className="line-clamp-1">{cuisine}</span>
            </>
          )}
        </div>

        {/* Badges / Extras */}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {prepTime && (
            <span className="text-[10px] font-medium text-[#585C5C] border border-[#E6EAED] px-2 py-0.5 rounded-full bg-gray-50">
              Ready {prepTime}
            </span>
          )}
          {offersDelivery && (
            <span className="text-[10px] font-bold text-[#F44322] border border-[#F44322]/20 px-2 py-0.5 rounded-full bg-[#F44322]/5">
              DELIVERY
            </span>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-3 flex items-center gap-2">
          {user_id ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const event = new CustomEvent('openVendorChat', { detail: { vendorId: user_id } });
                window.dispatchEvent(event);
              }}
              className="flex-1 bg-[#F44322] hover:bg-[#D33516] text-white text-[11px] font-bold py-1.5 px-3 rounded-full transition-all flex items-center justify-center gap-1.5"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat
            </button>
          ) : (
            <span className="flex-1 text-[10px] text-gray-400 text-center py-1">No Chat</span>
          )}
          <Link 
            href={href}
            className="px-3 py-1.5 border border-gray-200 hover:border-vivid-red hover:text-vivid-red text-gray-600 text-[11px] font-bold rounded-full transition-all flex items-center justify-center"
          >
            Visit
          </Link>
        </div>
      </div>
    </div>
  );
}
