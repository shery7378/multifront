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
}) {
  return (
    <div className="flex gap-3 px-3 h-[114px] bg-[#F5F5F7] rounded-[6px] items-center">
      <div className="relative w-[82px] h-[96px] shrink-0 rounded-[6px] overflow-hidden bg-[#f4f4f400]">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="72px"
          onError={(e) => {
            e.target.src = '/images/NoImageLong.jpg';
          }}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <h3 className="text-[#2E3333] font-semibold text-base leading-tight line-clamp-2">
          {name}
        </h3>
        <div className="flex items-center gap-1.5 text-[#585C5C] text-sm mt-0.5">
          <span className="flex items-center text-lg gap-0.5">
            {STAR_SVG}
            </span>
            <span className="text-[#FFAD33]"  >{rating}</span>
          
          <span>{distance}</span>
          <span>{sellerType}</span>
        </div>
        <div className="flex items-center gap-[14px] mt-0">
          <Link
            href={seeSellerHref}
            className="w-[84px] h-[39px] flex justify-center items-center bg-[#eaeaea00] border-[0.7px] border-[#E6EAED] text-[#585C5C] text-sm rounded-[40px] transition-colors"
          >
            See seller
          </Link>
          <span className="text-sm font-normal text-[#F44322] shrink-0 underline">
            Ready in {readyInMinutes} Min
          </span>
        </div>
      </div>
    </div>
  );
}
