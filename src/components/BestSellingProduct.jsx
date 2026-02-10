//src/components/BestSellingProduct.jsx
'use client';
import { useState, useEffect, useRef } from "react";
import { useSelector } from 'react-redux';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import ProductCard from "./ProductCard"; // Assuming this is in the same directory
import ResponsiveText from "./UI/ResponsiveText";
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import { productFavorites } from '@/utils/favoritesApi';

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

export default function BestSellingProduct({ title = "Popular Products", products = [], productNo = 8, openModal, viewAllHref = '#', stores = [] }) {
  const { t } = useI18n();
  const [favorites, setFavorites] = useState([]); // Track favorite state for each product
  const swiperRef = useRef(null);

  // Get token from Redux to check authentication
  const { token } = useSelector((state) => state.auth);
  
  // Load favorites from database when products change (only if user is logged in)
  useEffect(() => {
    const loadFavorites = async () => {
      if (!products || products.length === 0) return;
      
      // If user is not logged in, clear all favorites
      if (!token) {
        setFavorites([]);
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
        
        // Create favorites array matching product indices
        const favArray = products.map((product) => {
          if (product?.id) {
            return favoriteSet.has(String(product.id));
          }
          return false;
        });
        
        setFavorites(favArray);
        console.log('✅ [BestSellingProduct] Loaded favorites:', favArray);
      } catch (error) {
        console.error('❌ [BestSellingProduct] Error loading favorites:', error);
        // Fallback to localStorage
        try {
          const saved = JSON.parse(localStorage.getItem('favorites') || '{}');
          const favArray = products.map((product) => {
            if (product?.id) {
              return !!saved[String(product.id)];
            }
            return false;
          });
          setFavorites(favArray);
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
      setFavorites([]);
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
    setFavorites((prev) =>
      prev.map((fav, i) => (i === index ? !fav : fav))
    );
  };

  const handlePreviewClick = (image, name) => {
    console.log(`Preview clicked for ${name} with image ${image}`);
    // Future implementation: Open a preview modal with the image and name
  };

  return (
    <div className="py-4">
        <div className="flex justify-between items-baseline mb-4">
          <ResponsiveText
            as="h2" minSize="1.375rem" maxSize="1.375rem" className="font-bold text-oxford-blue"
            style={{ fontSize: '22px', lineHeight: '28px', fontWeight: '700' }}
          >
            {title}
          </ResponsiveText>
          <Link href={viewAllHref} className="">
            <ResponsiveText
              as="span" minSize="0.8rem" maxSize="1rem" className="font-semibold text-vivid-red"
            >
              {t('product.viewAll')}
            </ResponsiveText>
          </Link>
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
  );
}