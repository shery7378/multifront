//src/components/ProductSlider.jsx
"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import ImageModal from "./ImageModal";
import ProductCard from "./ProductCard";
import ResponsiveText from "./UI/ResponsiveText";
import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";
import { productFavorites } from "@/utils/favoritesApi";
import { useSelector } from "react-redux";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const ProductSlider = ({
  title = "Popular Products",
  products = [],
  openModal,
  showArrows = true,
  showViewAll = true,
  viewAllHref = "#",
  emptyMessage = null,
  stores = [],
}) => {
  const { t } = useI18n();
  const [favorites, setFavorites] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState("");
  const [modalAlt, setModalAlt] = useState("");
  const swiperRef = useRef(null);

  // Get token from Redux to check authentication
  const { token } = useSelector((state) => state.auth);

  // Load favorites from database when products change (only if user is logged in)
  useEffect(() => {
    const loadFavorites = async () => {
      if (!products || products.length === 0) return;

      // If user is not logged in, clear all favorites
      if (!token) {
        setFavorites({});
        return;
      }

      try {
        // Get all favorite product IDs from database
        const favoriteIds = await productFavorites.getAll();
        const favoriteSet = new Set(favoriteIds.map((id) => String(id)));

        // Also check localStorage as backup
        try {
          const saved = JSON.parse(localStorage.getItem("favorites") || "{}");
          Object.keys(saved).forEach((key) => {
            if (saved[key]) {
              favoriteSet.add(key);
            }
          });
        } catch {}

        // Create favorites map by product index
        const favMap = {};
        products.forEach((product, index) => {
          if (product?.id) {
            favMap[index] = favoriteSet.has(String(product.id));
          }
        });

        setFavorites(favMap);
        console.log("✅ [ProductSlider] Loaded favorites:", favMap);
      } catch (error) {
        console.error("❌ [ProductSlider] Error loading favorites:", error);
        // Fallback to localStorage
        try {
          const saved = JSON.parse(localStorage.getItem("favorites") || "{}");
          const favMap = {};
          products.forEach((product, index) => {
            if (product?.id) {
              favMap[index] = !!saved[String(product.id)];
            }
          });
          setFavorites(favMap);
        } catch {}
      }
    };

    loadFavorites();

    // Listen for favorite updates
    const handleFavoriteUpdate = () => {
      loadFavorites();
    };

    // Listen for favorites cleared event (when user logs out)
    const handleFavoritesCleared = () => {
      console.log(
        "🔄 [ProductSlider] Favorites cleared, resetting favorites state",
      );
      setFavorites({});
    };

    // Listen for login event (when user logs in, reload favorites)
    const handleUserLoggedIn = () => {
      console.log("🔐 [ProductSlider] User logged in, reloading favorites");
      loadFavorites();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("favoriteUpdated", handleFavoriteUpdate);
      window.addEventListener("favoritesCleared", handleFavoritesCleared);
      window.addEventListener("userLoggedIn", handleUserLoggedIn);
      return () => {
        window.removeEventListener("favoriteUpdated", handleFavoriteUpdate);
        window.removeEventListener("favoritesCleared", handleFavoritesCleared);
        window.removeEventListener("userLoggedIn", handleUserLoggedIn);
      };
    }
  }, [products, token]);

  const toggleFavorite = (index) => {
    setFavorites((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handlePreviewClick = (image, alt) => {
    setModalImage(image);
    setModalAlt(alt);
    setModalOpen(true);
  };


  const handlePrev = () => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  };

  const handleNext = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };
  return (
    <>
      <div className="pt-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-baseline mb-4">
          <ResponsiveText
            as="h2"
            minSize="1.375rem"
            maxSize="1.375rem"
            className="font-bold text-oxford-blue"
            style={{ fontSize: '22px', lineHeight: '28px', fontWeight: '700' }}
          >
            {title}
          </ResponsiveText>

          <div className="flex items-baseline space-x-2">
            {showViewAll && (
              <Link href={viewAllHref}>
                <ResponsiveText
                  as="span"
                  minSize="0.8rem"
                  maxSize="1rem"
                  className="font-semibold text-vivid-red"
                >
                  {t("product.viewAll")}
                </ResponsiveText>
              </Link>
            )}

            {showArrows && (
              <>
                <button
                  onClick={handlePrev}
                  className="p-2 border border-gray-200 rounded-full cursor-pointer hover:text-white hover:bg-vivid-red"
                  aria-label="Previous slide"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={handleNext}
                  className="p-2 border border-gray-200 rounded-full cursor-pointer hover:text-white hover:bg-vivid-red"
                  aria-label="Next slide"
                >
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {emptyMessage ||
                t("product.noProducts") ||
                "No products available at the moment."}
            </p>
          </div>
        ) : (
          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            // modules={[Pagination]}
            observer={true}
            observeParents={true}
            spaceBetween={16}
            slidesPerView={1}
            // pagination={{ clickable: true }}
            loop={products.length > 4}
            grabCursor={true}
            breakpoints={{
              412: {
                slidesPerView: 1,
                spaceBetween: 16,
              },
              640: {
                slidesPerView: 2,
                spaceBetween: 16,
              },
              768: {
                slidesPerView: 2,
                spaceBetween: 16,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 16,
              },
              1280: {
                slidesPerView: 5,
                spaceBetween: 16,
              },
            }}
            className="relative overflow-hidden !py-3"
          >
            {products.map((product, index) => (
              <SwiperSlide
                key={product?.id || `product-${index}`}
                className="w-auto sm:!w-auto max-w-[89vw] sm:max-w-auto"
              >
                <ProductCard
                  product={product}
                  index={index}
                  isFavorite={favorites[index]}
                  toggleFavorite={toggleFavorite}
                  onPreviewClick={handlePreviewClick}
                  productModal={() => openModal(product)}
                  stores={stores}
                />
              </SwiperSlide>
            ))}
            
          </Swiper>
          
        )}
        {/* White divider below products */}
        <div className="w-full h-[2px] bg-[#D9D9D9] border-t border-[#EAEAEA] my-4"></div>
      </div>

      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        imageSrc={modalImage}
        alt={modalAlt}
      />
    </>
  );
};

export default ProductSlider;
