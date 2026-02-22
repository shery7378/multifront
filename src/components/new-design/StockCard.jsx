'use client';

import Image from 'next/image';
import Link from 'next/link';

const STAR_SVG = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M7 1l1.5 4.5L13 6l-3.5 3L11 14l-4-2.5L3 14l1.5-5L1 6l4.5-.5L7 1z" fill="#F5A623" />
  </svg>
);

/**
 * Single in-stock product card: image, name, rating, distance, seller type, "See seller" button, "Ready in -XX Min".
 */
export default function StockCard({
  image = '/images/NoImageLong.jpg',
  name,
  rating,
  distance,
  sellerType,
  readyInMinutes,
  seeSellerHref = '#',
  providingPickup = false,
  providingSameDay = false,
}) {
  return (
    <div className="flex gap-4 pr-3 h-[140px] bg-[#F5F5F7] rounded-[8px] items-center overflow-hidden">
      <div className="relative w-[130px] h-full shrink-0 overflow-hidden bg-[#EAEAEA]">
        <Image
          src={image}
          alt={name}
          fill
          className="object-contain p-2"
          sizes="130px"
          unoptimized
          onError={(e) => {
            e.target.src = '/images/NoImageLong.jpg';
          }}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center py-3 h-full gap-1">
        <h3 className="text-[#092E3B] font-bold text-lg leading-tight line-clamp-1">
          {name}
        </h3>
        
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#585C5C] text-sm">
          <div className="flex items-center gap-1">
            {STAR_SVG}
            <span className="text-[#FFAD33] font-bold">{rating}</span>
          </div>
          {distance && <span className="font-bold text-[#F44322]">{distance}</span>}
          {sellerType && <span className="font-medium text-[#585C5C]">{sellerType}</span>}
        </div>

        {/* Service Badges */}
        {(providingPickup || providingSameDay) && (
          <div className="flex gap-2 mb-1">
            {providingPickup && (
              <span className="text-[10px] bg-white border border-[#E8F5E9] text-[#2E7D32] px-2 rounded-full font-bold uppercase">
                Pickup
              </span>
            )}
            {providingSameDay && (
              <span className="text-[10px] bg-white border border-[#FFF3E0] text-[#E65100] px-2 rounded-full font-bold uppercase">
                Same Day
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-1">
          <Link
            href={seeSellerHref}
            className="px-4 py-1.5 flex justify-center items-center bg-white border border-[#E6EAED] text-[#585C5C] text-xs font-bold rounded-[40px] hover:bg-gray-50 transition-colors"
          >
            See seller
          </Link>
          {readyInMinutes && (
            <span className="text-sm font-bold text-[#F44322] underline shrink-0 cursor-default">
              {readyInMinutes} Min
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
