'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { addItem } from '@/store/slices/cartSlice';
import Button from './UI/Button';
import { useI18n } from '@/contexts/I18nContext';

export default function ReorderButton({ order, className = '' }) {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleReorder = async () => {
    if (!order || !order.products || order.products.length === 0) {
      alert('No items to reorder');
      return;
    }

    setLoading(true);
    try {
      // Add all products from order to cart
      for (const orderProduct of order.products) {
        const product = orderProduct.product || orderProduct;
        
        // Extract product details
        const productDetail = typeof orderProduct.product_detail === 'string'
          ? JSON.parse(orderProduct.product_detail)
          : orderProduct.product_detail || {};

        const payload = {
          id: product.id || orderProduct.product_id,
          product: product,
          price: orderProduct.unit_price || orderProduct.price || product.price || 0,
          quantity: orderProduct.qty || orderProduct.quantity || 1,
          ...(productDetail.color ? { color: productDetail.color } : {}),
          ...(productDetail.size ? { size: productDetail.size } : {}),
          ...(productDetail.battery_life ? { batteryLife: productDetail.battery_life } : {}),
          ...(productDetail.storage ? { storage: productDetail.storage } : {}),
          ...(productDetail.ram ? { ram: productDetail.ram } : {}),
        };

        dispatch(addItem(payload));
      }

      // Redirect to cart or checkout
      setTimeout(() => {
        router.push('/check-out-delivery');
      }, 500);
    } catch (error) {
      console.error('Failed to reorder:', error);
      alert('Failed to add items to cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!order || !order.products || order.products.length === 0) {
    return null;
  }

  return (
    <Button
      variant="outline"
      onClick={handleReorder}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></span>
          Adding...
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 mr-2 inline-block"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reorder
        </>
      )}
    </Button>
  );
}

