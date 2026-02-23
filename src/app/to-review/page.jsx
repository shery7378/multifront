'use client';

import FrontHeader from '@/components/FrontHeader';
import ReviewModal from '@/components/modals/ReviewModal';
import StoreReviewModal from '@/components/modals/StoreReviewModal';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useI18n } from '@/contexts/I18nContext';
import { useGetRequest } from '@/controller/getRequests';
import { motion } from 'framer-motion';
import { useEffect, useState } from "react";
import { FaCartShopping } from 'react-icons/fa6';
import { MdOutlineArrowOutward } from "react-icons/md";

export default function ToReviewPage() {
  const { t } = useI18n();
  const { formatPrice } = useCurrency();
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
    getData('/orders/my', true);
  }, []);

  const getProductsToReview = () => {
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

    if (orders.length === 0) return [];
    return processOrdersArray(orders);
  };

  const processOrdersArray = (orders) => {
    if (!Array.isArray(orders)) return [];

    const productsToReview = [];
    const reviewedProductIds = new Set();

    orders.forEach((order) => {
      const normalize = (s) => String(s || '').toLowerCase().trim();
      const orderStatus = normalize(order.status);
      const orderShipping = normalize(order.shipping_status);

      const strictStatuses = ['delivered', 'completed', 'done'];
      const isOrderEligible = strictStatuses.includes(orderStatus) || strictStatuses.includes(orderShipping);

      const items = order.items || order.order_items || order.products || order.order_products || order.product_detail || [];

      items.forEach((item) => {
        const itemShipping = normalize(item.shipping_status);
        let effectiveStatus = 'pending';
        let isItemEligible = false;

        if (strictStatuses.includes(itemShipping)) {
          isItemEligible = true;
          effectiveStatus = itemShipping;
        } else if (isOrderEligible) {
          isItemEligible = true;
          effectiveStatus = orderShipping || orderStatus;
        }

        if (!isItemEligible) return;

        const productId = item.product_id || item.product?.id || item.id;

        if (productId && !reviewedProductIds.has(productId)) {
          const image = item.product?.featured_image?.url ||
            item.product?.images?.[0]?.url ||
            item.product?.image ||
            item.image ||
            item.product_image;

          const store = order.store;
          const storeInfo = {
            id: store?.id,
            name: store?.name || order.store_name || 'Store',
            address: store?.full_address || store?.address || '',
            logo: store?.logo || store?.banner_image,
            isReviewed: store?.is_reviewed_by_current_user > 0
          };

          productsToReview.push({
            id: productId,
            name: item.product_name || item.product?.name || item.name || 'Product',
            image,
            price: item.price || item.unit_price || item.total || 0,
            description: item.product?.short_description || item.product?.description || item.description || '',
            orderId: order.id,
            orderNumber: order.order_number || order.orderNumber || order.id,
            orderDate: order.created_at || order.createdAt || order.date,
            itemId: item.id,
            status: effectiveStatus,
            store: storeInfo
          });
          reviewedProductIds.add(productId);
        }
      });
    });

    return productsToReview;
  };

  const productsToReview = getProductsToReview();
  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

  const handleReviewClick = (product) => {
    setSelectedProduct(product);
    setIsReviewModalOpen(true);
  };

  const handleStoreReviewClick = (store) => {
    if (!store?.id || store.isReviewed) return;
    setSelectedStore(store);
    setIsStoreReviewModalOpen(true);
  };

  const handleReviewSubmitted = () => {
    setIsReviewModalOpen(false);
    setSelectedProduct(null);
    getData('/orders/my', true);
  };

  const handleStoreReviewSubmitted = () => {
    setIsStoreReviewModalOpen(false);
    setSelectedStore(null);
    getData('/orders/my', true);
  };

  return (
    <div className="min-h-screen bg-white">
      <FrontHeader />
      <main className="pt-24 xl:pt-28 pb-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-oxford-blue">
              {t('common.reviews') || 'Reviews'}
            </h1>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#F24E2E]"></div>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-red-500 text-center py-10">
              {t('common.error')}: {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && productsToReview.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-2xl">
              <FaCartShopping className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-700">No products to review</h2>
              <p className="text-gray-500 mt-2">Complete an order to see it here.</p>
            </div>
          )}

          {/* Review Cards Grid */}
          {!loading && !error && productsToReview.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsToReview.map((product, index) => {
                const productImgSrc = product.image
                  ? `${base}/${String(product.image).replace(/^\/+/, '')}`
                  : '/images/products-image/controller3.png';

                const storeLogoSrc = product.store.logo
                  ? `${base}/${String(product.store.logo).replace(/^\/+/, '')}`
                  : '/images/stores/default.png';

                return (
                  <motion.div
                    key={`${product.orderId}-${product.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-[#EAEAEA] rounded-xl p-3"
                  >
                    {/* Store Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-[69px] h-[69px] rounded-full overflow-hidden border-0 flex-shrink-0">
                          <img
                            src={storeLogoSrc}
                            alt={product.store.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-xl lg:text-2xl font-semibold text-oxford-blue leading-tight mb-1">
                            {product.store.name}
                          </h3>
                          {product.store.address && (
                            <p className="text-sm text-[#092E3B99] font-normal">
                              {product.store.address}
                            </p>
                          )}
                        </div>
                      </div>
                      <MdOutlineArrowOutward className="text-[#F44322] w-5 h-5 flex-shrink-0 mt-2" />
                    </div>

                    {/* Product Details */}
                    <div className="flex gap-6 mb-8">
                      <div className="w-[95px] h-[94px] bg-[#F5F5F5] rounded-[6px] overflow-hidden flex-shrink-0">
                        <img
                          src={productImgSrc}
                          alt={product.name}
                          className="w-full h-full object-cover mix-blend-multiply"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-baseline gap-2 mb-1">
                          <span className="text-[13px] text-oxford-black font-medium">Order</span>
                          <span className="text-[13px] text-[#F44322] font-medium">
                            (#{product.orderNumber})
                          </span>
                        </div>

                        <h4 className="font-semibold text-lg text-oxford-blue mb-1 leading-tight">
                          {product.name} <span className="text-[#F44322]">({formatPrice(product.price)})</span>
                        </h4>

                        <p className="text-[10px] text-[#092E3B99] leading-relaxed">
                          <span className="line-clamp-2">{product.description}</span>
                          <button className="text-[#F44322] ml-1 hover:underline">See More.</button>
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex !flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => handleStoreReviewClick(product.store)}
                        disabled={product.store.isReviewed}
                        className={`flex-1 py-4.5 !rounded-[6px] !lg:h-[60px] !h-[46px] font-medium transition-colors text-center bg-[#F3F3F3] ${
                          product.store.isReviewed
                            ? 'bg-bg-[#F3F3F3] hover:bg-[#F3F3F3] text-[#092E3B] cursor-not-allowed'
                            : 'bg-[#F3F3F3] hover:bg-[#F3F3F3] text-[#092E3B]'
                        }`}
                      >
                        {product.store.isReviewed ? 'Store Reviewed' : 'Store Review'}
                      </button>
                      <button
                        onClick={() => handleReviewClick(product)}
                        className="flex-1 py-4.5 !rounded-[6px] !lg:h-[60px] !h-[46px] bg-[#F44322] text-white font-medium transition-colors text-center shadow-none"
                      >
                        Product Review
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Modals */}
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
      </main>
    </div>
  );
}