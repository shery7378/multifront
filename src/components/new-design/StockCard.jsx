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
    <div className="flex gap-3 px-3 h-[120px] bg-[#F5F5F7] rounded-[6px] items-center">
      <div className="relative w-[82px] h-[100px] shrink-0 rounded-[6px] overflow-hidden bg-[#f4f4f400]">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="82px"
          unoptimized
          onError={(e) => {
            e.target.src = '/images/NoImageLong.jpg';
          }}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center py-2 h-full">
        <h3 className="text-[#2E3333] font-semibold text-sm leading-tight line-clamp-1 mb-1">
          {name}
        </h3>
        
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[#585C5C] text-[11px] mb-1">
          <div className="flex items-center gap-0.5">
            {STAR_SVG}
            <span className="text-[#FFAD33] font-bold ml-0.5">{rating}</span>
          </div>
          {distance && <span className="font-medium text-[#F44322]">{distance}</span>}
          {sellerType && <span className="truncate max-w-[80px]">{sellerType}</span>}
        </div>

        {/* Service Badges */}
        <div className="flex gap-1 mb-2">
          {providingPickup && (
            <span className="text-[8px] bg-white border border-[#E8F5E9] text-[#2E7D32] px-1 rounded-full font-bold uppercase">
              Pickup
            </span>
          )}
          {providingSameDay && (
            <span className="text-[8px] bg-white border border-[#FFF3E0] text-[#E65100] px-1 rounded-full font-bold uppercase">
              Same Day
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Link
            href={seeSellerHref}
            className="px-3 py-1 flex justify-center items-center bg-white border border-[#E6EAED] text-[#585C5C] text-[10px] font-semibold rounded-[40px] hover:bg-gray-50 transition-colors"
          >
            See seller
          </Link>
          {readyInMinutes && (
            <span className="text-[10px] font-normal text-[#F44322] underline shrink-0">
              {readyInMinutes} Min
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
