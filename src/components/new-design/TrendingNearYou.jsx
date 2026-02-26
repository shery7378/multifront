"use client";

import Link from "next/link";
import TrendingProductCard from "./TrendingProductCard";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { useCurrency } from "@/contexts/CurrencyContext";

/** Apply client-side filters on top of the API-returned products */
function applyFilters(products, activeFilters, sameDayActive) {
  let list = [...products];

  // Same day — keep products where same_day_delivery === true / 1
  if (sameDayActive) {
    list = list.filter((p) => p.same_day_delivery || p.same_day);
  }

  // Price range
  const priceFilter = activeFilters["Price"];
  if (priceFilter && priceFilter !== "Any") {
    list = list.filter((p) => {
      const price = Number(p.price_tax_excl || p.price || 0);
      if (priceFilter === "Under £100") return price < 100;
      if (priceFilter === "£100–£500") return price >= 100 && price <= 500;
      if (priceFilter === "£500–£1000") return price >= 500 && price <= 1000;
      if (priceFilter === "Over £1000") return price > 1000;
      return true;
    });
  }

  // Condition
  const condition = activeFilters["Condition"];
  if (condition && condition !== "Any") {
    list = list.filter(
      (p) => (p.condition || "").toLowerCase() === condition.toLowerCase()
    );
  }

  // Brand
  const brand = activeFilters["Brand"];
  if (brand && brand !== "All brands") {
    list = list.filter((p) =>
      (p.brand || p.manufacturer || "")
        .toLowerCase()
        .includes(brand.toLowerCase())
    );
  }

  // Storage
  const storage = activeFilters["Storage"];
  if (storage && storage !== "Any") {
    list = list.filter((p) =>
      (p.storage || p.capacity || "")
        .toLowerCase()
        .includes(storage.toLowerCase())
    );
  }

  // Colour
  const colour = activeFilters["Colour"];
  if (colour && colour !== "Any") {
    list = list.filter((p) =>
      (p.colour || p.color || "").toLowerCase().includes(colour.toLowerCase())
    );
  }

  // Ready In (client-side cap)
  const readyIn = activeFilters["Ready In"];
  if (readyIn && readyIn !== "Any") {
    const maxMins =
      readyIn === "15 min"
        ? 15
        : readyIn === "30 min"
        ? 30
        : readyIn === "1 hour"
        ? 60
        : readyIn === "2 hours"
        ? 120
        : null;
    if (maxMins !== null) {
      list = list.filter((p) => {
        const mins = Number(p.ready_in_minutes || p.prep_time || 999);
        return mins <= maxMins;
      });
    }
  }

  // Sort
  const sort = activeFilters["Sort"];
  if (sort === "Lowest price") {
    list.sort(
      (a, b) =>
        Number(a.price_tax_excl || a.price || 0) -
        Number(b.price_tax_excl || b.price || 0)
    );
  } else if (sort === "Highest price") {
    list.sort(
      (a, b) =>
        Number(b.price_tax_excl || b.price || 0) -
        Number(a.price_tax_excl || a.price || 0)
    );
  } else if (sort === "Ready soon") {
    list.sort(
      (a, b) =>
        Number(a.ready_in_minutes || a.prep_time || 999) -
        Number(b.ready_in_minutes || b.prep_time || 999)
    );
  } else if (sort === "Distance") {
    list.sort((a, b) => Number(a.distance || 999) - Number(b.distance || 999));
  }

  return list;
}

export default function TrendingNearYou({
  products = [],
  loading = false,
  activeFilters = {},
  sameDayActive = false,
  onProductView,
}) {
  const { formatPrice } = useCurrency();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

  const getProductImage = (product) => {
    let imageUrl =
      product.featured_image?.url || product.base_image?.url || product.image;
    if (
      !imageUrl &&
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      imageUrl = product.images[0].url;
    }
    if (!imageUrl) return "/images/NoImageLong.jpg";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${apiBase}/${imageUrl.replace(/^\//, "")}`;
  };

  const displayProducts = applyFilters(products, activeFilters, sameDayActive);

  if (loading && products.length === 0) {
    return (
      <section className="w-full py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

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
              {displayProducts.length !== products.length && (
                <span className="ml-2 text-sm font-normal text-[#F44322]">
                  ({displayProducts.length} of {products.length})
                </span>
              )}
            </h2>
            <Link
              href="/products"
              className="text-[#F44322] font-medium text-sm sm:text-base hover:underline shrink-0"
            >
              View All
            </Link>
          </div>

          {/* Swiper Slider */}
          {displayProducts.length > 0 ? (
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
                {displayProducts.map((product) => (
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
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">
              No products match the selected filters.
            </p>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <hr className="my-6 border-t border-gray-200" />
      </div>
    </>
  );
}
