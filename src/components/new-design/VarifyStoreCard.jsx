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
      className="flex gap-3 px-0 min-h-[150px] bg-[#ffffff] border border-[#E6EAED] rounded-[6px] items-center overflow-hidden transition-all group"
    >
      <div className="relative w-[91px] min-h-[150px] shrink-0 rounded-tl-[6px] rounded-bl-[6px] overflow-hidden bg-[#f4f4f400]">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-300"
          sizes="72px"
          unoptimized
          onError={(e) => {
            e.target.src = '/images/NoImageLong.jpg';
          }}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-2 pr-4">
        <h3 className="text-[#2E3333] font-semibold text-base leading-tight line-clamp-1 transition-colors">
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
        <div className="flex items-center gap-2 mt-auto overflow-hidden">
          {readyInMinutes && (
            <span className="text-xs font-medium text-[#585C5C] shrink-0 border border-[#E6EAED] px-2 py-0.5 rounded-full">
              Ready-{readyInMinutes}Min
            </span>
          )}
          {offersDelivery && (
            <span className="text-xs font-medium text-[#F44322] shrink-0">
              Delivery
            </span>
          )}
          {offersPickup && (
            <span className="text-xs font-medium text-[#F44322] shrink-0">
              Pickup
            </span>
          )}
        </div>


      </div>
    </Link>
  );
}
