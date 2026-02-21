'use client';

import Link from 'next/link';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import VarifyStoreCard from './VarifyStoreCard';

const sliderSettings = {
  dots: false,
  infinite: true,
  speed: 500,
  slidesToShow: 3.5,
  slidesToScroll: 1,
  arrows: true,
  rows: 2,
  slidesPerRow: 1,
  responsive: [
    {
      breakpoint: 1280,
      settings: { slidesToShow: 3.5, rows: 2, slidesPerRow: 1 },
    },
    {
      breakpoint: 1024,
      settings: { slidesToShow: 3, rows: 2, slidesPerRow: 1 },
    },
    {
      breakpoint: 768,
      settings: { slidesToShow: 2.5, rows: 2, slidesPerRow: 1 },
    },
    {
      breakpoint: 640,
      settings: { slidesToShow: 2, rows: 2, slidesPerRow: 1 },
    },
    {
      breakpoint: 480,
      settings: { slidesToShow: 1.2, rows: 2, slidesPerRow: 1 },
    },
  ],
};

export default function NearStoreSection({ stores = [], loading = false, title = "Trending Near You" }) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  const getStoreImage = (store) => {
    // Try logo first, then banner_image
    let imageUrl = store.logo || store.banner_image || store.image;
    
    if (!imageUrl) return '/images/NoImageLong.jpg';
    
    // If it's already a full URL
    if (imageUrl.startsWith('http')) {
      // Normalize localhost to 127.0.0.1 if apiBase is 127.0.0.1 to avoid CORS/identity issues
      if (apiBase.includes('127.0.0.1') && imageUrl.includes('localhost')) {
        return imageUrl.replace('localhost', '127.0.0.1');
      }
      return imageUrl;
    }
    
    // Otherwise prepend apiBase and cleanup slashes
    const cleanPath = imageUrl.replace(/^\//, '');
    return `${apiBase.replace(/\/$/, '')}/${cleanPath}`;
  };

  if (loading && stores.length === 0) {
    return (
      <section className="w-full py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 h-24 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (stores.length === 0) return null;

  return (
    <section className="w-full py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#092E3B] font-bold text-lg sm:text-xl">
            {title}
          </h2>
          <Link
            href="/stores"
            className="text-[#F44322] font-medium text-sm sm:text-base hover:underline"
          >
            View All
          </Link>
        </div>

        {/* Stores Slider */}
        <Slider {...sliderSettings}>
          {stores.map((store) => (
            <div key={store.id} className="px-2">
              <VarifyStoreCard
                image={getStoreImage(store)}
                name={store.name}
                rating={store.rating || store.avg_rating || 0}
                distance={store.distance ? `${store.distance} km` : null}
                readyInMinutes={store.ready_in_minutes || store.prep_time || store.preparation_time || null}
                sellerType={store.type || store.category_name || null}
                categories={store.categories || []}
                offersDelivery={store.offers_delivery}
                offersPickup={store.offers_pickup}
                latitude={parseFloat(store.latitude)}
                longitude={parseFloat(store.longitude)}
                seeSellerHref={store.slug ? `/store/${store.slug}` : `/store/${store.id}`}
              />
            </div>
          ))}
        </Slider>

      </div>
    </section>
  );
}
