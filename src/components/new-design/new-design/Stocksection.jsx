'use client';

import Image from 'next/image';
import Link from 'next/link';
import StockCard from './StockCard';

const PROMO = {
  logo: '/images/new-icons/watch-apple-icon.svg', // use apple logo path when available
  tagline: 'The ultimate way to watch your health.',
  seeSellersHref: '#',
  bookDeliveryHref: '#',
  heroImage: '/images/new-icons/stockBanner.svg', // replace with Apple Watch hero image
};

const IN_STOCK_ITEMS = [
  {
    id: '1',
    image: '/images/new-icons/stockImage1.svg',
    name: 'Iphone 17 Pro Max',
    rating: 4.6,
    distance: '2.2km',
    sellerType: 'Elite Seller',
    readyInMinutes: -45,
    seeSellerHref: '#',
  },
  {
    id: '2',
    image: '/images/new-icons/stockImage2.svg',
    name: 'Apple Watch SE 3',
    rating: 4.2,
    distance: '2.2km',
    sellerType: 'Verified Seller',
    readyInMinutes: -20,
    seeSellerHref: '#',
  },
  {
    id: '3',
    image: '/images/new-icons/stockImage3.svg',
    name: 'Iphone 16 Air',
    rating: 4.6,
    distance: '2.2km',
    sellerType: 'Elite Seller',
    readyInMinutes: -25,
    seeSellerHref: '#',
  },
  {
    id: '4',
    image: '/images/new-icons/stockImage4.svg',
    name: 'Apple Watch Series 11',
    rating: 5.0,
    distance: '2.2km',
    sellerType: 'Pro Seller',
    readyInMinutes: -35,
    seeSellerHref: '#',
  },
];

export default function Stocksection() {
  return (
    <section className="w-full py-8 sm:pt-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left: Promo banner */}
          <div className="lg:flex-2 flex flex-col bg-[#F5F5F7] rounded-[6px] overflow-hidden bg-[url('/images/new-icons/stockBanner.svg')] bg-cover bg-center lg:h-[529px]">
            <div className="flex flex-col sm:flex-row flex-1 p-6 sm:p-8">
              <div className="flex-1 flex flex-col justify-strat gap-[22px] items-center">
                <div className="">
                  <Image
                    src={PROMO.logo}
                    alt="Apple"
                    width={100}
                    height={4832}
                    className="w-auto h-12 object-contain"
                  />
                </div>

                <p className="text-[#092E3B] font-bold text-2xl md:text-[27px]">
                  {PROMO.tagline}
                </p>
                <div className="flex flex-wrap gap-[14px]">
                  <Link
                    href={PROMO.seeSellersHref}
                    className="inline-flex items-center justify-center px-5 py-2.5 lg:w-[192px] lg:h-[50px] md:w-[100px] h-[40px] rounded-[6px] bg-[#F44322] text-white font-medium text-base  hover:bg-[#F44322] transition-colors"
                  >
                    See Nearby Sellers
                  </Link>
                  <Link
                    href={PROMO.bookDeliveryHref}
                    className="inline-flex items-center justify-center px-5 py-2.5 lg:w-[192px] lg:h-[50px] md:w-[100px] h-[40px] rounded-[6px] bg-[#EAEAEA] text-[#4A4A4A] font-medium text-base  transition-colors"
                  >
                    Book a Delivery Slot
                  </Link>
                </div>

              </div>
            </div>
          </div>

          {/* Right: In Stock list */}
          <div className="lg:w-[360px] lg:shrink-0 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#092E3B] font-semibold text-base lg:text-lg">
                In Stock 5 Min
              </span>
              <button
                type="button"
                className="text-[#F44322] font-normal text-base"
              >
                Refresh
              </button>
            </div>
            <div className="flex flex-col gap-2.5 overflow-y-auto  pr-1">
              {IN_STOCK_ITEMS.map((item) => (
                <StockCard
                  key={item.id}
                  image={item.image}
                  name={item.name}
                  rating={item.rating}
                  distance={item.distance}
                  sellerType={item.sellerType}
                  readyInMinutes={item.readyInMinutes}
                  seeSellerHref={item.seeSellerHref}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
