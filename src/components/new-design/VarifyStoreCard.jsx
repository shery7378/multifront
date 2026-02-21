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
  readyInMinutes,
  seeSellerHref = '#',
}) {
  return (
    <div className="flex gap-3 px-0 h-[114px] bg-[#ffffff] border border-[#E6EAED] rounded-[6px] items-center overflow-hidden">
      <div className="relative w-[91px] h-[114px] shrink-0 rounded-tl-[6px] rounded-bl-[6px] rounded-bl-[0px] rounded-br-[0px] overflow-hidden bg-[#f4f4f400]">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="72px"
          unoptimized
          onError={(e) => {
            e.target.src = '/images/NoImageLong.jpg';
          }}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <h3 className="text-[#2E3333] font-semibold text-base leading-tight line-clamp-1">
          {name}
        </h3>
        <div className="flex items-center gap-1.5 text-[#585C5C] text-sm mt-0.5">
          <span className="flex items-center text-lg gap-0.5">
            <StarIcon className="w-4 h-4 text-[#4D7C1B]" />
          </span>
          {rating > 0 && <span className="text-[#4D7C1B]">{rating}</span>}
          {distance && <span>{distance}</span>}
          {sellerType && <span>{sellerType}</span>}
        </div>
        <div className="flex items-center gap-[14px] mt-0">
          <Link
            href={seeSellerHref}
            className="w-[84px] h-[39px] flex justify-center items-center bg-[#eaeaea00] border-[0.7px] border-[#E6EAED] text-[#585C5C] text-sm rounded-[40px] transition-colors"
          >
            See seller
          </Link>
          {readyInMinutes && (
            <span className="text-sm font-normal text-[#F44322] shrink-0 underline">
              Ready in {readyInMinutes} Min
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
