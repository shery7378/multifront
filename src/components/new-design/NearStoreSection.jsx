'use client';

import Link from 'next/link';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import VarifyStoreCard from './VarifyStoreCard';

const TRENDING_PLACEHOLDER_ITEMS = [
  {
    id: '1',
    image: '/images/new-icons/image.png',
    name: 'Iphone 14 Pro (256 GB)',
    currentPrice: '$120',
    originalPrice: '$160',
    rating: 5,
    reviewCount: 88,
    readyMinutes: 45,
  },
  {
    id: '2',
    image: '/images/new-icons/image2.png',
    name: 'Iphone 14 Pro (256 GB)',
    currentPrice: '$120',
    originalPrice: '$160',
    rating: 5,
    reviewCount: 88,
    readyMinutes: 30,
  },
  {
    id: '3',
    image: '/images/new-icons/image3.png',
    name: 'Iphone 14 Pro (256 GB)',
    currentPrice: '$120',
    originalPrice: '$160',
    rating: 5,
    reviewCount: 88,
    readyMinutes: 60,
  },
  {
    id: '4',
    image: '/images/new-icons/image4.png',
    name: 'Iphone 14 Pro (256 GB)',
    currentPrice: '$120',
    originalPrice: '$160',
    rating: 5,
    reviewCount: 88,
    readyMinutes: 20,
  },
];

const NEAR_STORE_ITEMS = [
  {
    id: '1',
    name: 'TechHub Manor Park',
    image: '/images/new-icons/image5.png',
    rating: 4.6,
    distance: '2.2km',
    readyTime: 'Ready - 45M',
    tag: 'Pickups',
  },
  {
    id: '2',
    name: '7Bone',
    image: '/images/new-icons/image6.png',
    rating: 4.6,
    distance: '2.2km',
    readyTime: 'Ready - 60M',
    tag: 'Same-Day',
  },
  {
    id: '3',
    name: 'Wagamama',
    image: '/images/new-icons/image7.png',
    rating: 4.6,
    distance: '2.2km',
    readyTime: 'Ready - 45M',
    tag: 'Pickups',
  },
  {
    id: '4',
    name: "Nando's",
    image: '/images/new-icons/image8.png',
    rating: 4.6,
    distance: '2.2km',
    readyTime: 'Ready - 45M',
    tag: 'Same-Day',
  },
   
];

const sliderSettings = {
  dots: false,
  infinite: true,
  speed: 500,
  slidesToShow: 3.5,
  slidesToScroll: 1,
  arrows: true,
  responsive: [
    {
      breakpoint: 1280,
      settings: { slidesToShow: 3.5 },
    },
    {
      breakpoint: 1024,
      settings: { slidesToShow: 3 },
    },
    {
      breakpoint: 768,
      settings: { slidesToShow: 2.5 },
    },
    {
      breakpoint: 640,
      settings: { slidesToShow: 2 },
    },
    {
      breakpoint: 480,
      settings: { slidesToShow: 1.2 },
    },
  ],
};

export default function NearStoreSection() {
  return (
    <section className="w-full py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#092E3B] font-bold text-lg sm:text-xl">
            Trending Near You
          </h2>
          <Link
            href="#"
            className="text-[#F44322] font-medium text-sm sm:text-base hover:underline"
          >
            View All
          </Link>
        </div>

        {/* First Slider - Trending Products */}
        <Slider {...sliderSettings} className="mb-4">
          {TRENDING_PLACEHOLDER_ITEMS.map((item) => (
            <div key={item.id} className="px-2">
              <VarifyStoreCard {...item} />
            </div>
          ))}
        </Slider>

       

        {/* Second Slider - Near Stores */}
        <Slider {...sliderSettings}>
          {NEAR_STORE_ITEMS.map((store) => (
            <div key={store.id} className="px-2">
              <VarifyStoreCard
                image={store.image}
                name={store.name}
                rating={store.rating}
                distance={store.distance}
                readyMinutes={store.readyTime}
                tag={store.tag}
              />
            </div>
          ))}
        </Slider>

      </div>
    </section>
  );
}
