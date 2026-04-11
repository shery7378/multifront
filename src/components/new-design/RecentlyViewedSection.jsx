'use client';

import Link from 'next/link';
import TrendingProductCard from './TrendingProductCard';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getProductImageUrl } from '@/utils/urlHelpers';

const sliderSettings = {
  dots: false,
  infinite: false, // Don't loop for recently viewed
  speed: 500,
  slidesToShow: 4.5,
  slidesToScroll: 1,
  arrows: true,
  ltr: true,
  responsive: [
    { breakpoint: 1280, settings: { slidesToShow: 4.5, ltr: true } },
    { breakpoint: 1024, settings: { slidesToShow: 3.5, ltr: true } },
    { breakpoint: 768,  settings: { slidesToShow: 3,   ltr: true } },
    { breakpoint: 640,  settings: { slidesToShow: 2,   ltr: true } },
    { breakpoint: 0,    settings: { slidesToShow: 1.2, ltr: true } },
  ],
};

export default function RecentlyViewedSection({
  products = [],
  onProductView
}) {
  const { formatPrice } = useCurrency();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  const getProductImage = (product) => {
    return getProductImageUrl(product);
  };

  if (!products || products.length === 0) return null;

  return (
    <>
      <section className="w-full py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[#092E3B] font-bold text-lg sm:text-xl">
              Recently Viewed
            </h2>
            <Link
              href="/products?section=recently-viewed"
              className="text-[#F44322] font-medium text-sm sm:text-base hover:underline shrink-0"
            >
              View All
            </Link>
          </div>

          {/* Results */}
          <Slider {...sliderSettings} className="max-h-[358px]">
            {products.map((product) => (
              <div key={product.id} className="px-2" onClick={() => onProductView?.(product)}>
                <TrendingProductCard
                  image={getProductImage(product)}
                  name={product.name}
                  currentPrice={formatPrice(product.price_tax_excl || product.price || 0)}
                  originalPrice={product.compared_price && product.compared_price > 0 ? formatPrice(product.compared_price) : null}
                  rating={Number(product.rating || 0)}
                  reviewCount={product.review_count || product.reviews_count || 0}
                  readyMinutes={product.ready_in_minutes || null}
                  productHref={`/product/${product.id}`}
                  product={product}
                />
              </div>
            ))}
          </Slider>
        </div>
      </section>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <hr className="my-6 border-t border-gray-200" />
      </div>
    </>
  );
}
