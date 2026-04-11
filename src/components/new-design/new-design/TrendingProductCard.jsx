'use client';

import { EyeIcon, HeartIcon, StarIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
export default function TrendingProductCard({
  image = '/images/NoImageLong.jpg',
  name = 'Iphone 14 Pro (256 GB)',
  currentPrice = '$120',
  originalPrice = '$160',
  rating = 5,
  reviewCount = 88,
  readyMinutes = 45,
  productHref = '#',
  onWishlistClick,
  onQuickViewClick,
  className = '',
}) {
  const stars = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className="inline-block">
      <StarIcon
        className={`w-5 h-5 ${i < rating ? 'fill-[#F5B430] text-[#F5B430]' : 'fill-none text-gray-300'}`}
        aria-hidden="true"
      />
    </span>
  ));

  return (
    <article
      className={`flex flex-col rounded-[8px] overflow-hidden bg-white shrink-0 ${className}`}
    >
      <div className="block relative aspect-square bg-[#F5F5F7]">
        <div className="flex items-center justify-center aspect-square bg-[#F5F5F7] p-5">
          <Image
            src={image}
            alt={name}
            width={190}
            height={180}
            className="object-contain p-2 w-full h-full"
            onError={(e) => {
              e.target.src = '/images/NoImageLong.jpg';
            }}
          />
        </div>

        {/* Ready tag — top-left */}
        <span className="absolute top-2 left-2 w-[101px] h-[26px] flex items-center justify-center rounded-[4px] bg-[#DB4444] text-white text-xs font-normal">
          Ready - {readyMinutes}M
        </span>
        {/* Icons — top-right, stacked */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 text-[#2E3333]">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onWishlistClick?.();
            }}
            className="w-[34px] h-[34px] flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
            aria-label="Add to wishlist"
          >
            <HeartIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onQuickViewClick?.();
            }}
            className="w-[34px] h-[34px] flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
            aria-label="Quick view"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-1.5 bg-white">
        <Link href={productHref}>
          <h3 className="text-[#092E3B] font-medium text-base leading-tight line-clamp-2 transition-colors">
            {name}
          </h3>
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-[#DB4444] font-medium text-base">{currentPrice}</span>
          <span className="text-[#585C5C] text-base line-through">{originalPrice}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-0.5">{stars}</span>
          <span className="text-[#585C5C] text-base font-semibold">({reviewCount})</span>
        </div>
      </div>
    </article>
  );
}
