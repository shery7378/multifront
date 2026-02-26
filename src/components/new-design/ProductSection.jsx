"use client";

import Link from "next/link";
import TrendingProductCard from "./TrendingProductCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getProductImageUrl } from "@/utils/urlHelpers";

export default function ProductSection({
  title,
  products = [],
  viewAllHref = "#",
  onProductView,
}) {
  const { formatPrice } = useCurrency();

  const getProductImage = (product) => {
    return getProductImageUrl(product);
  };

  if (!products || products.length === 0) return null;

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <hr className="my-6 border-t border-gray-200" />
      </div>

      <section className="w-full py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#092E3B] font-bold text-lg sm:text-xl">
              {title}
            </h2>
            <Link
              href={viewAllHref}
              className="text-[#F44322] font-medium text-sm sm:text-base hover:underline shrink-0"
            >
              View All
            </Link>
          </div>

          {/* Swiper Slider — free-mode, no arrows, starts from left */}
          <div className="overflow-hidden">
            <Swiper
              modules={[FreeMode]}
              slidesPerView={1.3}
              spaceBetween={12}
              freeMode={{
                enabled: true,
                momentum: true,
                momentumRatio: 0.6,
                momentumVelocityRatio: 0.8,
              }}
              grabCursor={true}
              centeredSlides={false}
              breakpoints={{
                480: { slidesPerView: 2.2, spaceBetween: 12 },
                640: { slidesPerView: 2.5, spaceBetween: 14 },
                768: { slidesPerView: 3.3, spaceBetween: 14 },
                1024: { slidesPerView: 4.2, spaceBetween: 16 },
                1280: { slidesPerView: 4.5, spaceBetween: 16 },
              }}
            >
              {products.map((product) => (
                <SwiperSlide
                  key={product.id}
                  className="h-auto!"
                  onClick={() => onProductView?.(product)}
                >
                  <TrendingProductCard
                    image={getProductImage(product)}
                    name={product.name}
                    currentPrice={formatPrice(
                      product.price_tax_excl || product.price || 0
                    )}
                    originalPrice={formatPrice(
                      product.compared_price && product.compared_price > 0
                        ? product.compared_price
                        : null
                    )}
                    rating={Number(product.rating || 0)}
                    reviewCount={
                      product.review_count || product.reviews_count || 0
                    }
                    readyMinutes={product.ready_in_minutes || null}
                    productHref={`/product/${product.id}`}
                    product={product}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <hr className="my-6 border-t border-gray-200" />
      </div>
    </>
  );
}
