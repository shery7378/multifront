"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import TrendingProductCard from "./TrendingProductCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getProductImageUrl } from "@/utils/urlHelpers";

/** How many cards are visible at each breakpoint (must match Swiper breakpoints) */
const SLIDES_PER_VIEW = {
  default: 1.3,
  480: 2.2,
  640: 2.5,
  768: 3.3,
  1024: 4.2,
  1280: 4.5,
};

function getSlidesPerView() {
  if (typeof window === "undefined") return SLIDES_PER_VIEW.default;
  const w = window.innerWidth;
  if (w >= 1280) return SLIDES_PER_VIEW[1280];
  if (w >= 1024) return SLIDES_PER_VIEW[1024];
  if (w >= 768) return SLIDES_PER_VIEW[768];
  if (w >= 640) return SLIDES_PER_VIEW[640];
  if (w >= 480) return SLIDES_PER_VIEW[480];
  return SLIDES_PER_VIEW.default;
}

function ProductCard({ product, formatPrice, getProductImage, onProductView }) {
  return (
    <div onClick={() => onProductView?.(product)} className="cursor-pointer">
      <TrendingProductCard
        image={getProductImage(product)}
        name={product.name}
        currentPrice={formatPrice(product.price_tax_excl || product.price || 0)}
        originalPrice={formatPrice(
          product.compared_price && product.compared_price > 0
            ? product.compared_price
            : null
        )}
        rating={Number(product.rating || 0)}
        reviewCount={product.review_count || product.reviews_count || 0}
        readyMinutes={product.ready_in_minutes || null}
        productHref={`/product/${product.id}`}
        product={product}
      />
    </div>
  );
}

export default function ProductSection({
  title,
  products = [],
  viewAllHref = "#",
  onProductView,
}) {
  const { formatPrice } = useCurrency();
  const [needsSlider, setNeedsSlider] = useState(false);

  useEffect(() => {
    const check = () => {
      const perView = getSlidesPerView();
      setNeedsSlider(products.length > Math.floor(perView));
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [products.length]);

  const getProductImage = (product) => getProductImageUrl(product);

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

          {needsSlider ? (
            /* ── Swiper: only when cards overflow the row ── */
            <div className="overflow-hidden">
              <Swiper
                modules={[FreeMode]}
                slidesPerView={SLIDES_PER_VIEW.default}
                spaceBetween={12}
                freeMode={{
                  enabled: true,
                  momentum: true,
                  momentumRatio: 0.6,
                  momentumVelocityRatio: 0.8,
                }}
                grabCursor={true}
                centeredSlides={false}
                initialSlide={0}
                breakpoints={{
                  480: {
                    slidesPerView: SLIDES_PER_VIEW[480],
                    spaceBetween: 12,
                  },
                  640: {
                    slidesPerView: SLIDES_PER_VIEW[640],
                    spaceBetween: 14,
                  },
                  768: {
                    slidesPerView: SLIDES_PER_VIEW[768],
                    spaceBetween: 14,
                  },
                  1024: {
                    slidesPerView: SLIDES_PER_VIEW[1024],
                    spaceBetween: 16,
                  },
                  1280: {
                    slidesPerView: SLIDES_PER_VIEW[1280],
                    spaceBetween: 16,
                  },
                }}
              >
                {products.map((product) => (
                  <SwiperSlide key={product.id} className="h-auto!">
                    <ProductCard
                      product={product}
                      formatPrice={formatPrice}
                      getProductImage={getProductImage}
                      onProductView={onProductView}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : (
            /* ── Static flex row: items fit, start flush left ── */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  formatPrice={formatPrice}
                  getProductImage={getProductImage}
                  onProductView={onProductView}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <hr className="my-6 border-t border-gray-200" />
      </div>
    </>
  );
}
