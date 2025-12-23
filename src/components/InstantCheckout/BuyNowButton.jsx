'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Button from '@/components/UI/Button';
import axios from 'axios';
import InstantCheckoutModal from './InstantCheckoutModal';

export default function BuyNowButton({ product, quantity = 1, className = '', onSuccess }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const router = useRouter();

  const handleBuyNow = async (checkoutData = null) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // If modal data provided, process directly
    if (checkoutData) {
      await processInstantCheckout(checkoutData);
      return;
    }

    // Check if user has saved address and payment method
    const hasSavedData = await checkSavedData();
    
    if (hasSavedData) {
      // Show modal to confirm or select
      setIsModalOpen(true);
    } else {
      // Redirect to full checkout
      router.push(`/check-out-delivery`);
    }
  };

  const checkSavedData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const [addressRes, paymentRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/addresses`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/payment-methods`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { data: [] } })),
      ]);

      return addressRes.data?.data?.length > 0;
    } catch {
      return false;
    }
  };

  const processInstantCheckout = async (checkoutData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const currency = localStorage.getItem('currency') || 'USD';
      const payload = {
        product_id: product.id,
        quantity,
        store_id: product.store_id || product.store?.id,
        currency, // Send selected currency
        use_saved_address: checkoutData.useSavedAddress,
        use_saved_payment: checkoutData.useSavedPayment,
        address_id: checkoutData.addressId,
        payment_method_id: checkoutData.paymentMethodId,
        ...(product.color ? { color: product.color } : {}),
        ...(product.size ? { size: product.size } : {}),
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/checkout/instant/buy-now`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 201) {
        if (onSuccess) {
          onSuccess(response.data.data);
        } else {
          // Redirect to order confirmation
          router.push(`/orders/${response.data.data.order.id}`);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process instant checkout');
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="primary"
        onClick={() => handleBuyNow()}
        disabled={loading}
        className={className}
      >
        {loading ? 'Processing...' : 'Buy Now'}
      </Button>

      <InstantCheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={processInstantCheckout}
        product={product}
        quantity={quantity}
      />
    </>
  );
}

