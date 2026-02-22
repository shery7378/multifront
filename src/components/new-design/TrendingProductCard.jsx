'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addItem } from '@/store/slices/cartSlice';
import { EyeIcon, HeartIcon, StarIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { CheckIcon, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
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
  product = null,       // full product object (needed for addItem payload)
  isFavorite = false,
  onWishlistClick,
  onQuickViewClick,
  className = '',
}) {
  const dispatch = useDispatch();
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const price = product
      ? Number(product.flash_price ?? product.price_tax_excl ?? product.price ?? 0)
      : 0;

    dispatch(
      addItem({
        id: product?.id || productHref,
        product,
        price,
        quantity: 1,
      })
    );

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const stars = Array.from({ length: 5 }, (_, i) => (
    <span key={i} className="inline-block">
      <StarIcon
        className={`w-4 h-4 ${i < rating ? 'fill-[#F5B430] text-[#F5B430]' : 'fill-none text-gray-300'}`}
        aria-hidden="true"
      />
    </span>
  ));

  return (
    <article className={`flex flex-col rounded-[8px] overflow-hidden bg-white shrink-0 group ${className}`}>
      {/* Image area */}
      <div className="relative aspect-square bg-[#F5F5F7]">
        <Link href={productHref}>
          <div className="flex items-center justify-center aspect-square bg-[#F5F5F7] p-5">
            <Image
              src={image}
              alt={name}
              width={190}
              height={180}
              className="object-contain p-2 w-full h-full"
              unoptimized
              onError={(e) => { 
                console.log('❌ [TrendingProductCard] Image failed to load:', image);
                e.target.src = '/images/NoImageLong.jpg'; 
              }}
              onLoad={(e) => {
                console.log('✅ [TrendingProductCard] Image loaded successfully:', image);
              }}
            />
          </div>
        </Link>

        {/* Ready tag */}
        {readyMinutes && (
          <span className="absolute top-2 left-2 w-[101px] h-[26px] flex items-center justify-center rounded-[4px] bg-[#DB4444] text-white text-xs font-normal z-10">
            Ready - {readyMinutes}M
          </span>
        )}

        {/* Wishlist / Quick view icons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 text-[#2E3333] z-10">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onWishlistClick?.(); }}
            className="w-[34px] h-[34px] flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors text-oxford-blue"
            aria-label="Add to wishlist"
          >
            {isFavorite ? (
              <HeartIconSolid className="w-5 h-5 text-vivid-red" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onQuickViewClick?.(); }}
            className="w-[34px] h-[34px] flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
            aria-label="Quick view"
          >
            <EyeIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Add to Cart — slides up on hover */}
        <button
          type="button"
          onClick={handleAddToCart}
          className={`
            absolute bottom-0 left-0 right-0 w-full flex items-center justify-center gap-2
            py-2.5 text-white text-xs font-semibold
            transition-all duration-300 z-10
            ${added
              ? 'bg-green-500 opacity-100 translate-y-0'
              : 'bg-[#F44322] opacity-0 group-hover:opacity-100 translate-y-full group-hover:translate-y-0'
            }
          `}
        >
          {added ? (
            <><CheckIcon className="w-4 h-4" /> Added!</>
          ) : (
            <><ShoppingCartIcon className="w-4 h-4" /> Add to Cart</>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5 bg-white">
        <Link href={productHref}>
          <h3 className="text-[#092E3B] font-medium text-base leading-tight line-clamp-2 hover:text-[#F44322] transition-colors">
            {name}
          </h3>
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-[#DB4444] font-medium text-base">{currentPrice}</span>
          {originalPrice && (
            <span className="text-[#585C5C] text-base line-through">{originalPrice}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-0.5">{stars}</span>
          <span className="text-[#585C5C] text-sm font-semibold">({reviewCount})</span>
        </div>
      </div>
    </article>
  );
}
