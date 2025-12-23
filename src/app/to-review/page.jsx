//src/app/to-review/page.jsx
'use client';
import { useEffect, useState } from "react";
import { useGetRequest } from '@/controller/getRequests';
import { useI18n } from '@/contexts/I18nContext';
import Image from 'next/image';
import Link from 'next/link';
import ReviewModal from '@/components/modals/ReviewModal';
import StoreReviewModal from '@/components/modals/StoreReviewModal';
import FrontHeader from '@/components/FrontHeader';
import BackButton from '@/components/UI/BackButton';
import { FaStar, FaCartShopping, FaReceipt, FaStore } from 'react-icons/fa6';
import { motion } from 'framer-motion';

export default function ToReviewPage() {
  const { t } = useI18n();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isStoreReviewModalOpen, setIsStoreReviewModalOpen] = useState(false);
  
  const {
    data,
    error,
    loading,
    sendGetRequest: getData
  } = useGetRequest();


  useEffect(() => {
    // Fetch orders - same endpoint as orders page
    getData('/orders/my', true);
  }, []);

  // Extract products from orders that can be reviewed
  const getProductsToReview = () => {
    // Handle different data structures / API shapes
    let orders = [];
    if (Array.isArray(data)) {
      orders = data;
    } else if (Array.isArray(data?.data?.data)) {
      // Laravel ResourceCollection with custom payload:
      // { data: { status, message, data: [orders], pagination } }
      orders = data.data.data;
    } else if (Array.isArray(data?.data)) {
      orders = data.data;
    } else if (Array.isArray(data?.orders)) {
      orders = data.orders;
    }
    
    if (orders.length === 0) {
      console.log('No orders found in data:', data);
      return [];
    }
    
    return processOrdersArray(orders);
  };

  const processOrdersArray = (orders) => {
    if (!Array.isArray(orders)) {
      console.log('Orders data is not an array:', orders);
      return [];
    }
    
    console.log('Processing orders:', orders.length, 'orders found');
    
    const productsToReview = [];
    const reviewedProductIds = new Set(); // Track reviewed products
    
    // For now, include products from ALL orders for this user, regardless of status.
    orders.forEach((order, orderIndex) => {
      const items =
        order.items ||
        order.order_items ||
        order.products ||
        order.order_products ||
        order.product_detail ||
        [];
      
      console.log(`Order ${orderIndex + 1}: id=${order.id}, items=${items.length}`);
      
      if (items.length === 0) {
        console.log(`  ⚠ Order ${orderIndex + 1} has no items`);
      }
      
      items.forEach((item, itemIndex) => {
        const productId =
          item.product_id ||
          item.product?.id ||
          item.id;
        
        console.log(`  Item ${itemIndex + 1}:`, {
          productId,
          name: item.product_name || item.product?.name || item.name,
          hasProduct: !!item.product,
        });
        
        if (productId && !reviewedProductIds.has(productId)) {
          const image =
            item.product?.featured_image?.url ||
            item.product?.images?.[0]?.url ||
            item.product?.image ||
            item.image ||
            item.product_image;
          
          productsToReview.push({
            id: productId,
            name: item.product_name || item.product?.name || item.name || 'Product',
            image,
            orderId: order.id,
            orderNumber: order.order_number || order.orderNumber || order.id,
            orderDate: order.created_at || order.createdAt || order.date,
            itemId: item.id,
          });
          reviewedProductIds.add(productId);
          console.log(`  ✓ Added product ${productId} to review list`);
        }
      });
    });
    
    console.log('Final products to review:', productsToReview.length);
    return productsToReview;
  };

  const productsToReview = getProductsToReview();
  const [storesToReview, setStoresToReview] = useState([]);

  // Extract stores from orders that can be reviewed (one per store)
  useEffect(() => {
    // Handle different data structures / API shapes
    let orders = [];
    if (Array.isArray(data)) {
      orders = data;
    } else if (Array.isArray(data?.data?.data)) {
      orders = data.data.data;
    } else if (Array.isArray(data?.data)) {
      orders = data.data;
    } else if (Array.isArray(data?.orders)) {
      orders = data.orders;
    }
    
    if (!orders || orders.length === 0) {
      setStoresToReview([]);
      return;
    }
    
    const storeMap = new Map(); // Store store info by store_id
    
    // First, collect all unique stores from orders
    orders.forEach(order => {
      // Check multiple possible status values (case-insensitive)
      const completedStatuses = ['completed', 'delivered', 'done', 'paid'];
      const normalizedStatus = (value) => String(value || '').toLowerCase().trim();
      const statusFlags = {
        status: normalizedStatus(order.status),
        shipping_status: normalizedStatus(order.shipping_status),
        payment_status: normalizedStatus(order.payment_status),
      };
      
      const isCompleted =
        completedStatuses.includes(statusFlags.status) ||
        completedStatuses.includes(statusFlags.shipping_status) ||
        completedStatuses.includes(statusFlags.payment_status);
      
      if (isCompleted) {
        const storeId = order.store_id || order.store?.id;
        const store = order.store;
        
        if (storeId && !storeMap.has(storeId)) {
          storeMap.set(storeId, {
            id: storeId,
            name: store?.name || order.store_name || order.storeName || 'Store',
            logo: store?.logo || store?.banner_image || store?.bannerImage,
            fullAddress: store?.full_address || store?.fullAddress || store?.address,
            slug: store?.slug
          });
        }
      }
    });

    // For now, add all stores (backend will filter duplicates)
    // In production, you'd check user's existing store reviews here
    const stores = Array.from(storeMap.values());
    setStoresToReview(stores);
  }, [data]);
  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

  const handleReviewClick = (product) => {
    setSelectedProduct(product);
    setIsReviewModalOpen(true);
  };

  const handleStoreReviewClick = (store) => {
    setSelectedStore(store);
    setIsStoreReviewModalOpen(true);
  };

  const handleReviewSubmitted = () => {
    setIsReviewModalOpen(false);
    setSelectedProduct(null);
    // Refresh the list
    getData('/orders', true);
  };

  const handleStoreReviewSubmitted = () => {
    setIsStoreReviewModalOpen(false);
    setSelectedStore(null);
    // Refresh the list
    getData('/orders/my', true);
  };

  return (
    <div className="min-h-screen">
      <FrontHeader />
      <main className="p-6 pt-24 xl:pt-28">
        <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <BackButton variant="gradient" showLabel={true} />
            
            <div className="mt-6 flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-[#F24E2E] to-[#E03E1E] rounded-2xl shadow-lg">
                <FaStar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-oxford-blue mb-2">
                  {t('common.toReview') || 'To Review'}
                </h1>
                <p className="text-gray-600 text-sm md:text-base">
                  {t('common.reviewYourPurchases') || 'Share your experience and help others make better decisions'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#F24E2E] mb-4"></div>
              <p className="text-gray-600 text-lg">{t('common.loading') || 'Loading...'}</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center"
            >
              <p className="text-red-700 font-semibold text-lg mb-2">
                {t('common.error') || 'Error'}
              </p>
              <p className="text-red-600 mb-4">{error}</p>
              <p className="text-sm text-gray-600">
                Debug: Check browser console for order data structure
              </p>
            </motion.div>
          )}

          {/* Debug Info - Remove in production */}
          {!loading && !error && data && (
            <div className="mb-4 p-4 bg-gray-100 rounded-lg text-xs">
              <strong>Debug Info:</strong> Orders found:{' '}
              {Array.isArray(data)
                ? data.length
                : (Array.isArray(data?.data?.data)
                    ? data.data.data.length
                    : (Array.isArray(data?.data) ? data.data.length : 0))},{' '}
              Products to review: {productsToReview.length}, 
              Stores to review: {storesToReview.length}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && productsToReview.length === 0 && storesToReview.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center"
            >
              <div className="max-w-md mx-auto">
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#F24E2E] to-[#E03E1E] rounded-full blur-2xl opacity-20"></div>
                    <div className="relative bg-gradient-to-br from-[#F24E2E] to-[#E03E1E] p-6 rounded-full">
                      <FaCartShopping className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-oxford-blue mb-3">
                  {t('common.noProductsToReview') || 'No Products To Review Yet'}
                </h2>
                <p className="text-gray-600 mb-6 text-lg">
                  {t('common.completeOrderToReview') || 'Complete an order to leave a review and help other customers'}
                </p>
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-2 bg-[#F24E2E] hover:bg-[#E03E1E] text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                  <FaReceipt className="w-5 h-5" />
                  {t('nav.orders') || 'View My Orders'}
                </Link>
              </div>
            </motion.div>
          )}

          {/* Stores Section */}
          {!loading && !error && storesToReview.length > 0 && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-oxford-blue mb-2 flex items-center gap-2">
                  <FaStore className="w-6 h-6 text-[#F24E2E]" />
                  {t('common.storesToReview') || 'Stores To Review'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {storesToReview.length === 1 
                    ? t('common.storeWaitingReview') || 'store waiting for your review'
                    : t('common.storesWaitingReview') || 'stores waiting for your review'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {storesToReview.map((store, index) => {
                  const storeImgSrc = store.logo
                    ? `${base}/${String(store.logo).replace(/^\/+/, '')}`
                    : '/images/stores/default.png';

                  return (
                    <motion.div
                      key={store.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group"
                    >
                      {/* Store Image */}
                      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        <img
                          src={storeImgSrc}
                          alt={store.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <FaStar className="w-4 h-4 text-green-500" />
                          <span className="text-xs font-semibold text-gray-700">
                            {t('common.delivered') || 'Delivered'}
                          </span>
                        </div>
                      </div>

                      {/* Store Info */}
                      <div className="p-5">
                        <h3 className="font-bold text-oxford-blue mb-3 line-clamp-2 text-lg group-hover:text-[#F24E2E] transition-colors">
                          {store.name}
                        </h3>
                        
                        {store.fullAddress && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {store.fullAddress}
                          </p>
                        )}
                        
                        <button
                          onClick={() => handleStoreReviewClick(store)}
                          className="w-full bg-gradient-to-r from-[#F24E2E] to-[#E03E1E] hover:from-[#E03E1E] hover:to-[#F24E2E] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group/btn"
                        >
                          <FaStar className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                          <span>{t('common.reviewStore') || 'Review Store'}</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {/* Products Section */}
          {!loading && !error && productsToReview.length > 0 && (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-oxford-blue mb-2 flex items-center gap-2">
                  <FaStar className="w-6 h-6 text-[#F24E2E]" />
                  {t('common.productsToReview') || 'Products To Review'}
                </h2>
                <p className="text-gray-600 text-sm">
                  <span className="font-semibold text-oxford-blue">{productsToReview.length}</span>{' '}
                  {productsToReview.length === 1 
                    ? t('common.productWaitingReview') || 'product waiting for your review'
                    : t('common.productsWaitingReview') || 'products waiting for your review'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsToReview.map((product, index) => {
                  const productImgSrc = product.image
                    ? `${base}/${String(product.image).replace(/^\/+/, '')}`
                    : '/images/products-image/controller3.png';

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group"
                    >
                      {/* Product Image */}
                      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        <img
                          src={productImgSrc}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <FaStar className="w-4 h-4 text-green-500" />
                          <span className="text-xs font-semibold text-gray-700">
                            {t('common.delivered') || 'Delivered'}
                          </span>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-5">
                        <h3 className="font-bold text-oxford-blue mb-3 line-clamp-2 text-lg group-hover:text-[#F24E2E] transition-colors">
                          {product.name}
                        </h3>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FaReceipt className="w-4 h-4 text-[#F24E2E]" />
                            <span className="font-medium">Order #{product.orderNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>
                              {product.orderDate 
                                ? new Date(product.orderDate).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })
                                : ''}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleReviewClick(product)}
                          className="w-full bg-gradient-to-r from-[#F24E2E] to-[#E03E1E] hover:from-[#E03E1E] hover:to-[#F24E2E] text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group/btn"
                        >
                          <FaStar className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                          <span>{t('common.writeReview') || 'Write a Review'}</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {/* Product Review Modal */}
          {selectedProduct && (
            <ReviewModal
              isOpen={isReviewModalOpen}
              onClose={() => {
                setIsReviewModalOpen(false);
                setSelectedProduct(null);
              }}
              product={selectedProduct}
              onSubmitted={handleReviewSubmitted}
            />
          )}

          {/* Store Review Modal */}
          {selectedStore && (
            <StoreReviewModal
              isOpen={isStoreReviewModalOpen}
              onClose={() => {
                setIsStoreReviewModalOpen(false);
                setSelectedStore(null);
              }}
              store={selectedStore}
              onSubmitted={handleStoreReviewSubmitted}
            />
          )}
          </div>
        </div>
      </main>
    </div>
  );
}

