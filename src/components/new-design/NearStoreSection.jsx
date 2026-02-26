"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Grid } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/grid";
import VarifyStoreCard from "./VarifyStoreCard";

export default function NearStoreSection({
  stores = [],
  loading = false,
  title,
}) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  const [locationLabel, setLocationLabel] = useState(null);

  useEffect(() => {
    const readLocation = () => {
      const postcode = localStorage.getItem("postcode");
      const city = localStorage.getItem("city");
      const label = postcode || city;
      setLocationLabel(label);
    };

    readLocation();
    window.addEventListener("storage", readLocation);
    return () => window.removeEventListener("storage", readLocation);
  }, []);

  const displayTitle = title || (
    <span>
      Trending Store Near You
      {locationLabel && ` ${locationLabel}`}
    </span>
  );

  const getStoreImage = (store) => {
    let imageUrl = store.logo || store.banner_image || store.image;

    if (!imageUrl) return "/images/NoImageLong.jpg";

    if (imageUrl.startsWith("http")) {
      if (apiBase.includes("127.0.0.1") && imageUrl.includes("localhost")) {
        return imageUrl.replace("localhost", "127.0.0.1");
      }
      return imageUrl;
    }

    const cleanPath = imageUrl.replace(/^\//, "");
    return `${apiBase.replace(/\/$/, "")}/${cleanPath}`;
  };

  if (loading && stores.length === 0) {
    return (
      <section className="w-full py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded"></div>
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
            {displayTitle}
          </h2>
          <Link
            href="/stores"
            className="text-[#F44322] font-medium text-sm sm:text-base hover:underline shrink-0"
          >
            View All
          </Link>
        </div>

        {/* Stores Swiper — 2-row grid, free-mode, no arrows */}
        <div className="overflow-hidden">
          <Swiper
            modules={[FreeMode, Grid]}
            slidesPerView={1.2}
            spaceBetween={12}
            grid={{ rows: 2, fill: "row" }}
            freeMode={{
              enabled: true,
              momentum: true,
              momentumRatio: 0.6,
              momentumVelocityRatio: 0.8,
            }}
            grabCursor={true}
            centeredSlides={false}
            breakpoints={{
              480: {
                slidesPerView: 1.5,
                spaceBetween: 12,
                grid: { rows: 2, fill: "row" },
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 14,
                grid: { rows: 2, fill: "row" },
              },
              768: {
                slidesPerView: 2.5,
                spaceBetween: 14,
                grid: { rows: 2, fill: "row" },
              },
              1024: {
                slidesPerView: 3.3,
                spaceBetween: 16,
                grid: { rows: 2, fill: "row" },
              },
              1280: {
                slidesPerView: 3.5,
                spaceBetween: 16,
                grid: { rows: 2, fill: "row" },
              },
            }}
          >
            {stores.map((store) => (
              <SwiperSlide key={store.id} className="h-auto!">
                <VarifyStoreCard
                  image={getStoreImage(store)}
                  name={store.name}
                  rating={store.rating || store.avg_rating || 0}
                  distance={store.distance ? `${store.distance} km` : null}
                  readyInMinutes={
                    store.ready_in_minutes ||
                    store.prep_time ||
                    store.preparation_time ||
                    null
                  }
                  sellerType={store.type || store.category_name || null}
                  categories={store.categories || []}
                  offersDelivery={store.offers_delivery}
                  offersPickup={store.offers_pickup}
                  latitude={parseFloat(store.latitude)}
                  longitude={parseFloat(store.longitude)}
                  seeSellerHref={
                    store.slug ? `/store/${store.slug}` : `/store/${store.id}`
                  }
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
