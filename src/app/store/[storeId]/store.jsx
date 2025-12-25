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
import { storeFavorites } from "@/utils/favoritesApi";

export default function StorePage({ store, others }) {
  const { t } = useI18n();
  const [favoriteStores, setFavoriteStores] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const allProducts = store?.products || [];
  
  // Fetch favorite stores for "More to Explore" section
  useEffect(() => {
    async function fetchFavoriteStores() {
      try {
        setLoadingFavorites(true);
        const base = process.env.NEXT_PUBLIC_API_URL;
        
        // Get favorite store IDs
        const favoriteStoreIds = await storeFavorites.getAll();
        console.log('🏪 [StorePage] Favorite store IDs:', favoriteStoreIds);
        
        if (favoriteStoreIds.length === 0) {
          console.log('🏪 [StorePage] No favorite stores, using others');
          setFavoriteStores(others || []);
          setLoadingFavorites(false);
          return;
        }
        
        // Fetch favorite stores directly
        try {
          const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || localStorage.getItem('sanctum_token');
          const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          };
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const res = await fetch(`${base}/api/favorites/stores/data`, {
            headers,
            credentials: 'include',
            cache: "no-store"
          });
          
          if (res.ok) {
            const data = await res.json();
            const items = Array.isArray(data?.data) ? data.data : [];
            console.log('✅ [StorePage] Fetched favorite stores:', items.length);
            
            // Exclude current store from favorites
            const currentStoreId = String(store?.id || '');
            const currentStoreSlug = String(store?.slug || '');
            
            console.log('🔍 [StorePage] Current store:', { id: currentStoreId, slug: currentStoreSlug });
            console.log('🔍 [StorePage] Favorite stores before filter:', items.map(s => ({ id: String(s?.id || ''), slug: String(s?.slug || '') })));
            
            const filtered = items.filter(s => {
              const storeId = String(s?.id || '');
              const storeSlug = String(s?.slug || '');
              const isCurrent = storeId === currentStoreId || 
                               storeSlug === currentStoreSlug || 
                               storeId === currentStoreSlug || 
                               storeSlug === currentStoreId;
              return !isCurrent;
            });
            
            console.log('✅ [StorePage] Filtered favorite stores (excluded current):', filtered.length, 'out of', items.length);
            
            // If we have favorite stores after filtering, use them
            // If all favorites were filtered out (e.g., user only has current store as favorite), show others instead
            if (filtered.length > 0) {
              // We have favorite stores (excluding current), show them
              setFavoriteStores(filtered);
            } else if (items.length > 0) {
              // All favorites were filtered out (user only has current store as favorite), show others
              console.log('⚠️ [StorePage] All favorite stores were filtered out, using others');
              setFavoriteStores(others || []);
            } else {
              // No favorite stores at all, use others
              console.log('⚠️ [StorePage] No favorite stores found, using others');
              setFavoriteStores(others || []);
            }
          } else {
            console.log('⚠️ [StorePage] Could not fetch favorite stores, using others');
            setFavoriteStores(others || []);
          }
        } catch (e) {
          console.error('❌ [StorePage] Error fetching favorite stores:', e);
          setFavoriteStores(others || []);
        }
      } catch (e) {
        console.error('❌ [StorePage] Error getting favorite store IDs:', e);
        setFavoriteStores(others || []);
      } finally {
        setLoadingFavorites(false);
      }
    }
    
    fetchFavoriteStores();
  }, [store?.id, others]);

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

  console.log('🔍 [StorePage] Others stores:', others);
  console.log('🔍 [StorePage] Others count:', Array.isArray(others) ? others.length : 0);
  console.log('🔍 [StorePage] Favorite stores state:', favoriteStores);
  console.log('🔍 [StorePage] Favorite stores count:', favoriteStores.length);
  console.log('🔍 [StorePage] Loading favorites:', loadingFavorites);

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
          <MoreToExplore 
            title={t('product.moreToExplore')} 
            stores={
              !loadingFavorites && favoriteStores.length > 0 
                ? favoriteStores 
                : (Array.isArray(others) && others.length > 0 ? others : [])
            } 
          />
        </div>
      </div>
    </>
  );
}
