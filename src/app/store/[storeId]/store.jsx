"use client";
//src/app/store/[storeId]/store.jsx
import BestSellingProduct from "@/components/BestSellingProduct";
import FAQSection from "@/components/FAQSection";
import MoreToExplore from "@/components/MoreToExplore";
import ProductSlider from "@/components/ProductSlider";
import ProductSliderByCategory from "@/components/ProductSliderByCategory";
import ReviewSlider from "@/components/ReviewSlider";
import StoreReviews from "@/components/reviews/StoreReviews";
import StoreBanner from "@/components/StoreBanner";
import StoreNearYou from '@/components/StoreNearYou';
import BackButton from "@/components/UI/BackButton";
import { useGetRequest } from "@/controller/getRequests";
import { useEffect, useState } from "react";
import { useI18n } from '@/contexts/I18nContext';

export default function StorePage({ store, others }) {
  const { t } = useI18n();

  const allProducts = store?.products || [];

    // ✅ Pick only what StoreBanner needs
  const storeBannerData = {
    id: store?.id,
    slug: store?.slug,
    name: store?.name,
    bannerImage: store?.banner_image,
    description: store?.description,
    fullAddress: store?.full_address,
    latitude: store?.latitude,
    longitude: store?.longitude,
    offersDelivery: store?.offers_delivery,
    offersPickup: store?.offers_pickup,
    rating: store?.rating ?? store?.avg_rating ?? null,
    reviewCount: store?.reviews_count ?? store?.review_count ?? null,
    categories: store?.categories ?? store?.category_names ?? [],
    priceSymbol: store?.price_symbol ?? store?.currency_symbol ?? '£',
    user_id: store?.user_id, // Add user_id for contact vendor button
  };

  console.log(others, 'other store from store page....');

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Navigation Button */}
        <div className="back-button w-3">
          <BackButton />
        </div>

        {/* Store Banner Section */}
        <div className="store-banner mt-4">
          <StoreBanner store={storeBannerData} />
        </div>

        {/* Only render these if products exist */}
        {allProducts.length > 0 && (
          <>
            <div className="product-slider">
              <ProductSlider title={t('product.popularProducts')} products={allProducts} openModal={() => {}}  />
            </div>

            <div className="product-slider">
              <ProductSliderByCategory title={t('product.featured')} products={allProducts} openModal={() => {}} />
            </div>

            <div className="best-selling-product">
              <BestSellingProduct title={t('product.exploreOurProducts')} products={allProducts} openModal={() => {}}/>
            </div>
          </>
        )}

        <div className="reviews py-5">
          <ReviewSlider storeId={store?.id || store?.slug} />
        </div>

        <div className="FAQSection py-5">
          <FAQSection />
        </div>

        <div className="more-to-explore">
          <MoreToExplore title={t('product.moreToExplore')} stores={others} />
        </div>
      </div>
    </>
  );
}
