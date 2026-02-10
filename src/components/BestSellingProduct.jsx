//src/components/BestSellingProduct.jsx
'use client';
import { useState, useEffect, useRef } from "react";
import { useSelector } from 'react-redux';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import ProductCard from "./ProductCard"; // Assuming this is in the same directory
import ResponsiveText from "./UI/ResponsiveText";
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import { productFavorites } from '@/utils/favoritesApi';
import ImageModal from "./ImageModal";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function BestSellingProduct({ title = "Popular Products", products = [], productNo = 8, openModal, viewAllHref = '#', stores = [], showArrows = false }) {
  const { t } = useI18n();
  const [favorites, setFavorites] = useState({}); // Track favorite state for each product
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
        const favoriteSet = new Set(favoriteIds.map(id => String(id)));
        
        // Also check localStorage as backup
        try {
          const saved = JSON.parse(localStorage.getItem('favorites') || '{}');
          Object.keys(saved).forEach(key => {
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
        console.log('✅ [BestSellingProduct] Loaded favorites:', favMap);
      } catch (error) {
        console.error('❌ [BestSellingProduct] Error loading favorites:', error);
        // Fallback to localStorage
        try {
          const saved = JSON.parse(localStorage.getItem('favorites') || '{}');
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
      console.log('🔄 [BestSellingProduct] Favorites cleared, resetting favorites state');
      setFavorites({});
    };
    
    // Listen for login event (when user logs in, reload favorites)
    const handleUserLoggedIn = () => {
      console.log('🔐 [BestSellingProduct] User logged in, reloading favorites');
      loadFavorites();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('favoriteUpdated', handleFavoriteUpdate);
      window.addEventListener('favoritesCleared', handleFavoritesCleared);
      window.addEventListener('userLoggedIn', handleUserLoggedIn);
      return () => {
        window.removeEventListener('favoriteUpdated', handleFavoriteUpdate);
        window.removeEventListener('favoritesCleared', handleFavoritesCleared);
        window.removeEventListener('userLoggedIn', handleUserLoggedIn);
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
      console.log("Navigating Prev");
      swiperRef.current.slidePrev();
    }
  };

  const handleNext = () => {
    if (swiperRef.current) {
      console.log("Navigating Next");
      swiperRef.current.slideNext();
    }
  };

  return (
    <>
      <div className="pt-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-baseline mb-4">
          <ResponsiveText
            as="h2" minSize="1.375rem" maxSize="1.375rem" className="font-bold text-oxford-blue"
            style={{ fontSize: '22px', lineHeight: '28px', fontWeight: '700' }}
          >
            {title}
          </ResponsiveText>
          <div className="flex items-baseline space-x-2">
            <Link href={viewAllHref} className="">
              <ResponsiveText
                as="span" minSize="0.8rem" maxSize="1rem" className="font-semibold text-vivid-red"
              >
                {t('product.viewAll')}
              </ResponsiveText>
            </Link>

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
        <div className="overflow-x-auto sm:overflow-visible px-2 sm:px-0">
          {products.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No products available at the moment.
              </p>
            </div>
          ) : (
            <Swiper
              onSwiper={(swiper) => { swiperRef.current = swiper; }}
              spaceBetween={12}
              slidesPerView={1}
              loop={products.length > 4}
              grabCursor={true}
              breakpoints={{
                412: {
                  slidesPerView: 2,
                  spaceBetween: 0,
                },
                640: {
                  slidesPerView: 2,
                  spaceBetween: 0,
                },
                768: {
                  slidesPerView: 2,
                  spaceBetween: 4,
                },
                1024: {
                  slidesPerView: 4,
                  spaceBetween: 4,
                },
                1280: {
                  slidesPerView: 4,
                  spaceBetween: 24,
                },
              }}
              className="relative overflow-hidden !py-3"
            >
              {products.map((product, index) => {
                if (index < productNo) {
                  return (
                    <SwiperSlide
                      key={product?.id || `product-${index}`}
                      className="w-full sm:w-full max-w-[85vw] sm:max-w-[270px]"
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
                  );
                }
                return null; // Return null for indices >= productNo
              })}
            </Swiper>
          )}
        </div>
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
}