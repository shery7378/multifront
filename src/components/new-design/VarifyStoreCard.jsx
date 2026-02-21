'use client';

import { StarIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link'; 

export default function VarifyStoreCard({
  image = '/images/NoImageLong.jpg',
  name,
  rating,
  distance,
  sellerType,
  categories = [],
  readyInMinutes,
  offersDelivery = false,
  offersPickup = false,
  seeSellerHref = '#',
  latitude,
  longitude,
}) {
  // Calculate distance client-side if not provided by API
  const displayDistance = (() => {
    if (distance) return distance;
    // Fallback: calculate from store coordinates and user's saved location
    if (typeof window !== 'undefined' && latitude && longitude) {
      const userLat = parseFloat(localStorage.getItem('lat'));
      const userLng = parseFloat(localStorage.getItem('lng'));
      if (userLat && userLng) {
        const R = 6371; // Earth's radius in km
        const dLat = ((latitude - userLat) * Math.PI) / 180;
        const dLng = ((longitude - userLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((userLat * Math.PI) / 180) *
            Math.cos((latitude * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;
        return `${d.toFixed(1)} km`;
      }
    }
    return null;
  })();

  return (
    <Link 
      href={seeSellerHref}
      className="flex gap-3 px-0 min-h-[130px] bg-[#ffffff] border border-[#E6EAED] rounded-[6px] items-center overflow-hidden hover:border-[#F44322] hover:shadow-sm transition-all group"
    >
      <div className="relative w-[91px] min-h-[130px] shrink-0 rounded-tl-[6px] rounded-bl-[6px] overflow-hidden bg-[#f4f4f400]">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="72px"
          unoptimized
          onError={(e) => {
            e.target.src = '/images/NoImageLong.jpg';
          }}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-2 pr-4">
        <h3 className="text-[#2E3333] font-semibold text-base leading-tight line-clamp-1 group-hover:text-[#F44322] transition-colors">
          {name}
        </h3>
        <div className="flex items-center gap-1.5 text-[#585C5C] text-sm mt-0.5 flex-wrap">
          <span className="flex items-center gap-0.5">
            <StarIcon className="w-4 h-4 text-[#4D7C1B]" />
          </span>
          {rating > 0 && <span className="text-[#4D7C1B]">{rating}</span>}
          {displayDistance && (
            <>
              <span className="text-[#ccc]">•</span>
              <span className="text-[#585C5C] font-medium">{displayDistance}</span>
            </>
          )}
          {categories && categories.length > 0 && (
            <>
              <span className="text-[#ccc]">•</span>
              <span className="truncate">
                {categories.map(c => c.name).join(', ')}
              </span>
            </>
          )}
          {(!categories || categories.length === 0) && sellerType && (
            <>
              <span className="text-[#ccc]">•</span>
              <span>{sellerType}</span>
            </>
          )}
        </div>

        {/* Delivery / Pickup badges */}
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {offersDelivery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#E8F5E9] text-[#2E7D32]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2.05a2.5 2.5 0 014.9 0H19a1 1 0 001-1v-3a1 1 0 00-.293-.707l-3-3A1 1 0 0016 2h-2a1 1 0 00-1 1v3H3z"/>
              </svg>
              Delivery
            </span>
          )}
          {offersPickup && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#FFF3E0] text-[#E65100]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/>
              </svg>
              Pickup
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto">
          {readyInMinutes && (
            <span className="text-sm font-normal text-[#F44322] shrink-0 underline decoration-dotted">
              Ready in {readyInMinutes} Min
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
