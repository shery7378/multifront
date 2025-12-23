//src/components/BestSellingProduct.jsx
'use client';
import { useState } from "react";
import ProductCard from "./ProductCard"; // Assuming this is in the same directory
import ResponsiveText from "./UI/ResponsiveText";
import Link from 'next/link';
import { useI18n } from '@/contexts/I18nContext';

export default function BestSellingProduct({ title = "Popular Products", products = [], productNo = 8, openModal, viewAllHref = '#' }) {
  const { t } = useI18n();
  const [favorites, setFavorites] = useState(Array(products.length).fill(false)); // Track favorite state for each product

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