'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useGetRequest } from '@/controller/getRequests';
import ProductSlider from './ProductSlider';
import StoreNearYou from './StoreNearYou';
import ResponsiveText from './UI/ResponsiveText';
import { useI18n } from '@/contexts/I18nContext';

export default function PersonalizedFeed({ onProductView, allProducts = [] }) {
  const { t } = useI18n();
  const { token } = useSelector((state) => state.auth);
  const [feedData, setFeedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { data, error, loading: requestLoading, sendGetRequest } = useGetRequest();

  const fetchPersonalizedFeed = async () => {
    // Only fetch if user is logged in
    if (!token) {
      console.log('🔒 User not logged in, skipping personalized feed fetch');
      setFeedData({ products: [], stores: [], based_on_orders: [], based_on_favorites: [], trending_nearby: [] });
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Fetching personalized feed...');
      setLoading(true);
      setFeedData(null); // Reset data
      const postcode = localStorage.getItem('postcode');
      const city = localStorage.getItem('city');

      const params = new URLSearchParams();
      if (postcode) params.append('postcode', postcode);
      if (city) params.append('city', city);

      console.log('📡 PersonalizedFeed request:', `/personalized-feed?${params.toString()}`, 'auth:', !!token);
      await sendGetRequest(`/personalized-feed?${params.toString()}`, !!token, { suppressAuthErrors: true });
    } catch (error) {
      console.error('❌ Failed to fetch personalized feed:', error);
      // Set empty data on error so component shows empty state instead of loading forever
      setFeedData({ products: [], stores: [], based_on_orders: [], based_on_favorites: [], trending_nearby: [] });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonalizedFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Refresh when page becomes visible (user returns from checkout)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Page visible, checking if recommendations need refresh...');
        // Only refresh if we don't have data or if it's been a while
        if (!feedData || (feedData && Object.values(feedData).every(arr => !Array.isArray(arr) || arr.length === 0))) {
          console.log('🔄 Refreshing recommendations on page visibility...');
          fetchPersonalizedFeed();
        }
      }
    };

    const handleFocus = () => {
      console.log('🎯 Window focused, checking recommendations...');
      // Refresh if no data
      if (!feedData || (feedData && Object.values(feedData).every(arr => !Array.isArray(arr) || arr.length === 0))) {
        console.log('🔄 Refreshing recommendations on window focus...');
        fetchPersonalizedFeed();
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, feedData]);

  // Re-fetch when location changes
  useEffect(() => {
    const handleLocationUpdate = () => {
      console.log('📍 Location updated, refreshing recommendations...');
      fetchPersonalizedFeed();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('locationUpdated', handleLocationUpdate);
      return () => {
        window.removeEventListener('locationUpdated', handleLocationUpdate);
      };
    }
  }, [token]);

  // Re-fetch when order is placed/completed
  useEffect(() => {
    const handleOrderPlaced = (event) => {
      console.log('🛒 Order placed event received:', event.detail);
      // Wait a bit for backend to process the order, then refresh
      // Try multiple times as backend might need time to update recommendations
      setTimeout(() => {
        console.log('🔄 Refreshing recommendations after order (2s delay)...');
        fetchPersonalizedFeed();
      }, 2000);
      
      // Also refresh after a longer delay to ensure backend has processed
      setTimeout(() => {
        console.log('🔄 Second refresh of recommendations after order (10s delay)...');
        fetchPersonalizedFeed();
      }, 10000);
    };

    const handleOrderCompleted = (event) => {
      console.log('✅ Order completed event received:', event.detail);
      // Wait a bit for backend to process the order, then refresh
      setTimeout(() => {
        console.log('🔄 Refreshing recommendations after order completion...');
        fetchPersonalizedFeed();
      }, 2000);
    };

    const handleFavoriteUpdated = () => {
      console.log('❤️ Favorite updated, refreshing favorites in recommendations...');
      // Trigger the useEffect that loads favorites from localStorage
      if (feedData && allProducts.length > 0) {
        // Force re-evaluation by updating a dependency
        setFeedData(prev => ({ ...prev }));
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('orderPlaced', handleOrderPlaced);
      window.addEventListener('orderCompleted', handleOrderCompleted);
      window.addEventListener('favoriteUpdated', handleFavoriteUpdated);
      return () => {
        window.removeEventListener('orderPlaced', handleOrderPlaced);
        window.removeEventListener('orderCompleted', handleOrderCompleted);
        window.removeEventListener('favoriteUpdated', handleFavoriteUpdated);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, feedData, allProducts]);

  useEffect(() => {
    console.log('🔍 PersonalizedFeed state update:', {
      hasData: !!data?.data,
      hasError: !!error,
      requestLoading,
      dataStatus: data?.status,
      statusCode: data?.statusCode
    });
    
    // Sync local loading state with request loading state
    if (requestLoading) {
      setLoading(true);
      return; // Don't process data while loading
    }
    
    // Check if we have successful data
    if (data?.data) {
      console.log('✅ PersonalizedFeed received data:', Object.keys(data.data));
      setFeedData(data.data);
      setLoading(false);
      return;
    }
    
    // Check if we have an error (from axios or API response)
    if (error) {
      console.log('❌ PersonalizedFeed error detected:', error);
      setFeedData({ products: [], stores: [], based_on_orders: [], based_on_favorites: [], trending_nearby: [] });
      setLoading(false);
      return;
    }
    
    // Check if API returned an error status
    if (data?.error || data?.status === 'error' || data?.statusCode === 500 || data?.statusCode === 401) {
      console.log('❌ PersonalizedFeed API error:', data?.statusCode || data?.error);
      setFeedData({ products: [], stores: [], based_on_orders: [], based_on_favorites: [], trending_nearby: [] });
      setLoading(false);
      return;
    }
    
    // If request completed (not loading) but no data and no error, wait a bit then show empty state
    if (!requestLoading && data === null && !error) {
      // Request might still be in progress, wait a bit
      const timer = setTimeout(() => {
        // Use functional update to check current state without needing it in dependencies
        setFeedData(prev => {
          // Only set empty state if we don't already have data (might have been set by localStorage effect)
          if (!prev) {
            console.log('⏱️ PersonalizedFeed timeout - showing empty state');
            return { products: [], stores: [], based_on_orders: [], based_on_favorites: [], trending_nearby: [] };
          }
          return prev;
        });
        // Set loading to false since request has completed
        setLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [data, error, requestLoading]);

  // Fallback: Get favorite products from localStorage if API didn't return any
  // Only load favorites from localStorage if user is logged in
  useEffect(() => {
    if (!token || !feedData || !allProducts || allProducts.length === 0 || typeof window === 'undefined') {
      return;
    }

    // Normalize based_on_favorites array
    const normalizeArray = (arr) => {
      if (!arr) return [];
      return Array.isArray(arr) ? arr : (arr.toArray ? arr.toArray() : []);
    };
    
    const normalizedBasedOnFavorites = normalizeArray(feedData.based_on_favorites);
    
    if (normalizedBasedOnFavorites.length === 0) {
      try {
        const favoritesData = localStorage.getItem('favorites');
        if (favoritesData) {
          const favorites = JSON.parse(favoritesData);
          const favoriteKeys = Object.keys(favorites).filter(key => favorites[key] === true);
          
          if (favoriteKeys.length > 0) {
            console.log('❤️ Found favorites in localStorage:', favoriteKeys.length);
            
            // Match favorite product IDs with available products
            const favoriteProducts = [];
            const productMap = new Map(allProducts.map(p => [String(p?.id), p]));
            
            favoriteKeys.forEach(key => {
              // Try to find product by ID (key might be product ID or name)
              const product = productMap.get(key);
              if (product) {
                favoriteProducts.push(product);
              } else {
                // Try to find by name if key is not an ID
                const productByName = allProducts.find(p => String(p?.name) === key);
                if (productByName) {
                  favoriteProducts.push(productByName);
                }
              }
            });
            
            if (favoriteProducts.length > 0) {
              console.log('❤️ Matched favorite products:', favoriteProducts.length);
              // Update feedData with favorite products
              setFeedData(prev => ({
                ...prev,
                based_on_favorites: favoriteProducts.slice(0, 12) // Limit to 12 products
              }));
            }
          }
        }
      } catch (error) {
        console.error('❌ Error loading favorites from localStorage:', error);
      }
    }
  }, [token, feedData, allProducts]);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t('product.loadingRecommendations') || 'Loading recommendations...'}
        </p>
      </div>
    );
  }

  if (!feedData) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t('product.noRecommendations') || 'No recommendations available at the moment. Start browsing to get personalized recommendations!'}
        </p>
      </div>
    );
  }

  const {
    products = [],
    stores = [],
    categories = [],
    based_on_orders = [],
    based_on_favorites = [],
    trending_nearby = [],
  } = feedData;

  // Convert to arrays if they're collections
  const normalizeArray = (arr) => {
    if (!arr) return [];
    return Array.isArray(arr) ? arr : (arr.toArray ? arr.toArray() : []);
  };

  const normalizedProducts = normalizeArray(products);
  const normalizedStores = normalizeArray(stores);
  const normalizedBasedOnOrders = normalizeArray(based_on_orders);
  const normalizedBasedOnFavorites = normalizeArray(based_on_favorites);
  const normalizedTrendingNearby = normalizeArray(trending_nearby);

  // Use updated favorites from feedData (which may have been updated by useEffect)
  const finalBasedOnFavorites = feedData?.based_on_favorites 
    ? normalizeArray(feedData.based_on_favorites)
    : normalizedBasedOnFavorites;

  // Check if all sections are empty
  const hasAnyContent = 
    normalizedProducts.length > 0 ||
    normalizedStores.length > 0 ||
    normalizedBasedOnOrders.length > 0 ||
    finalBasedOnFavorites.length > 0 ||
    normalizedTrendingNearby.length > 0;

  if (!hasAnyContent) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {token 
            ? (t('product.noRecommendations') || 'No recommendations available at the moment. Start browsing to get personalized recommendations!')
            : (t('product.signInForRecommendations') || 'Sign in to get personalized recommendations based on your preferences and order history.')
          }
        </p>
        {token && (
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
            Recommendations will appear as you browse and make purchases.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Products Based on Your Orders */}
      {normalizedBasedOnOrders.length > 0 && (
        <div className="product-slider">
          <ProductSlider
            title={t('product.basedOnYourOrders') || 'Based on Your Orders'}
            products={normalizedBasedOnOrders}
            openModal={onProductView}
            viewAllHref="/products?section=reorder"
            showArrows={true}
          />
        </div>
      )}

      {/* Products from Favorite Stores / Liked Products */}
      {finalBasedOnFavorites.length > 0 && (
        <div className="product-slider">
          <ProductSlider
            title={t('product.fromFavoriteStores') || 'Your Liked Products'}
            products={finalBasedOnFavorites}
            openModal={onProductView}
            viewAllHref="/products?section=favorites"
            showArrows={true}
          />
        </div>
      )}

      {/* Recommended Products */}
      {normalizedProducts.length > 0 && (
        <div className="product-slider">
          <ProductSlider
            title={t('product.recommendedForYou') || 'Recommended for You'}
            products={normalizedProducts}
            openModal={onProductView}
            viewAllHref="/products?section=recommended"
            showArrows={true}
          />
        </div>
      )}

      {/* Recommended Stores */}
      {normalizedStores.length > 0 && (
        <div className="store-near-you">
          <StoreNearYou
            stores={normalizedStores}
            title={t('product.recommendedStores') || 'Recommended Stores'}
            viewAllHref="/stores"
          />
        </div>
      )}

      {/* Trending Nearby */}
      {normalizedTrendingNearby.length > 0 && (
        <div className="product-slider">
          <ProductSlider
            title={t('product.trendingNearby') || 'Trending Nearby'}
            products={normalizedTrendingNearby}
            openModal={onProductView}
            viewAllHref="/products?section=trending"
            showArrows={true}
          />
        </div>
      )}
    </div>
  );
}

