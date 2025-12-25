//src/components/BestSellingProduct.jsx
'use client';
import { useState, useEffect } from "react";
import ProductCard from "./ProductCard"; // Assuming this is in the same directory
import ResponsiveText from "./UI/ResponsiveText";
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';
import { productFavorites } from '@/utils/favoritesApi';

export default function BestSellingProduct({ title = "Popular Products", products = [], productNo = 8, openModal, viewAllHref = '#' }) {
  const { t } = useI18n();
  const [favorites, setFavorites] = useState([]); // Track favorite state for each product

  // Load favorites from database when products change
  useEffect(() => {
    const loadFavorites = async () => {
      if (!products || products.length === 0) return;
      
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
    
    if (typeof window !== 'undefined') {
      window.addEventListener('favoriteUpdated', handleFavoriteUpdate);
      return () => {
        window.removeEventListener('favoriteUpdated', handleFavoriteUpdate);
      };
    }
  }, [products]);

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
            as="h2" minSize="1rem" maxSize="1.375rem" className="font-semibold text-oxford-blue"
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
        <div className="overflow-x-auto sm:overflow-visible">
          <div className="flex justify-start flex-wrap gap-4 lg:gap-6">
            {products.map((product, index) => {
              if (index < productNo) {
                return (
                  <ProductCard
                    key={product?.id || `product-${index}`}
                    product={product}
                    index={index}
                    isFavorite={favorites[index]}
                    toggleFavorite={toggleFavorite}
                    onPreviewClick={handlePreviewClick}
                    productModal={() => openModal(product)}
                  />
                );
              }
              return null; // Return null for indices >= 4
            })}
          </div>
        </div>
    </div>
  );
}