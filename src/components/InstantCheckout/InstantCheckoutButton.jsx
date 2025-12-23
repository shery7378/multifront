'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import Button from '@/components/UI/Button';
import axios from 'axios';
import { clearCart } from '@/store/slices/cartSlice';
import InstantCheckoutModal from './InstantCheckoutModal';

export default function InstantCheckoutButton({ className = '' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  const router = useRouter();
  const dispatch = useDispatch();

  const handleInstantCheckout = async (checkoutData = null) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent('/check-out-delivery'));
      return;
    }

    if (items.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    // If modal data provided, process directly
    if (checkoutData) {
      await processInstantCheckout(checkoutData);
      return;
    }

    // Check if user has saved address
    const hasSavedData = await checkSavedData();
    
    if (hasSavedData) {
      setIsModalOpen(true);
    } else {
      router.push('/check-out-delivery');
    }
  };

  const checkSavedData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.data?.length > 0;
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
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.price,
        })),
        currency, // Send selected currency
        use_saved_address: checkoutData.useSavedAddress,
        use_saved_payment: checkoutData.useSavedPayment,
        address_id: checkoutData.addressId,
        payment_method_id: checkoutData.paymentMethodId,
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/checkout/instant/cart`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 201) {
        dispatch(clearCart());
        router.push(`/orders/${response.data.data.order.id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process instant checkout');
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="primary"
        onClick={() => handleInstantCheckout()}
        disabled={loading}
        className={className}
      >
        {loading ? 'Processing...' : 'Instant Checkout'}
      </Button>

      <InstantCheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={processInstantCheckout}
        items={items}
      />
    </>
  );
}

