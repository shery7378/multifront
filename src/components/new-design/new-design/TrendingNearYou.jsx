'use client';

import Link from 'next/link';
import TrendingProductCard from './TrendingProductCard';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const TRENDING_PLACEHOLDER_ITEMS = [
  {
    id: '1',
    image: '/images/new-icons/Trendingimage1.png',
    name: 'Iphone 14 Pro (256 GB)',
    currentPrice: '$120',
    originalPrice: '$160',
    rating: 5,
    reviewCount: 88,
    readyMinutes: 45,
    productHref: '#',
  },
  {
    id: '2',
    image: '/images/new-icons/Trendingimage2.png',
    name: 'Iphone 14 Pro (256 GB)',
    currentPrice: '$120',
    originalPrice: '$160',
    rating: 5,
    reviewCount: 88,
    readyMinutes: 30,
    productHref: '#',
  },
  {
    id: '3',
    image: '/images/new-icons/Trendingimage3.png',
    name: 'Iphone 14 Pro (256 GB)',
    currentPrice: '$120',
    originalPrice: '$160',
    rating: 5,
    reviewCount: 88,
    readyMinutes: 60,
    productHref: '#',
  },
  {
    id: '4',
    image: '/images/new-icons/Trendingimage4.png',
    name: 'Iphone 14 Pro (256 GB)',
    currentPrice: '$120',
    originalPrice: '$160',
    rating: 5,
    reviewCount: 88,
    readyMinutes: 20,
    productHref: '#',
  },
  {
    id: '5',
    image: '/images/new-icons/Trendingimage1.png',
    name: 'Iphone 14 Pro (256 GB)',
    currentPrice: '$120',
    originalPrice: '$160',
    rating: 5,
    reviewCount: 88,
    readyMinutes: 45,
    productHref: '#',
  },
];

const sliderSettings = {
  dots: false,
  infinite: true,
  speed: 500,
  slidesToShow: 4.5,
  slidesToScroll: 1,
  arrows: true,
  // The 'ltr' flag will make the half card appear on the right side instead of the left side
  ltr: true,
  responsive: [
    {
      breakpoint: 1280,
      settings: { slidesToShow: 4.5, ltr: true }
    },
    {
      breakpoint: 1024,
      settings: { slidesToShow: 3.5, ltr: true }
    },
    {
      breakpoint: 768,
      settings: { slidesToShow: 3, ltr: true }
    },
    {
      breakpoint: 640,
      settings: { slidesToShow: 2, ltr: true }
    },
    {
      breakpoint: 0,
      settings: { slidesToShow: 1.2, ltr: true }
    },
  ]
};

export default function TrendingNearYou() {
  return (
    <> 
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
      <hr className="my-6 border-t border-gray-200" />
      </div>
     <section className="w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#092E3B] font-bold text-lg sm:text-xl">
            Trending Near You
          </h2>
          <Link
            href="#"
            className="text-[#F44322] font-medium text-sm sm:text-base hover:underline shrink-0"
          >
            View All
          </Link>
        </div>

        {/* Slider */}
        <Slider {...sliderSettings}className='max-h-[358px]' >
          {TRENDING_PLACEHOLDER_ITEMS.map((item) => (
            <div key={item.id} className='px-2'>
              <TrendingProductCard {...item} />
            </div>
          ))}
        </Slider>

      </div>
    </section>
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
      <hr className="my-6 border-t border-gray-200" />
    </div>
    </>
  );
}
