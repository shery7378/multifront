//src/components/FavoriteProducts.jsx
'use client';
import { useState } from "react";
import ProductCard from "./ProductCard"; // Assuming this is in the same directory
import ResponsiveText from "./UI/ResponsiveText";

export default function FavoriteProducts({ title = "Popular Products", products = [], productNo = 8 }) {
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
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-4">
          <ResponsiveText
            as="h2" minSize="1rem" maxSize="1.7rem" className="font-semibold text-oxford-blue"
          >
            {title}
          </ResponsiveText>
        </div>
        <div className="overflow-x-auto sm:overflow-visible">
          <div className="flex justify-start flex-wrap">
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
                  />
                );
              }
              return null; // Return null for indices >= 4
            })}
          </div>
        </div>
      </div>
    </div>
  );
}