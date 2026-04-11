'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import Button from '@/components/UI/Button';
import axios from 'axios';
import { clearCart } from '@/store/slices/cartSlice';
import InstantCheckoutModal from './InstantCheckoutModal';

export default function InstantCheckoutButton({ className = '' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  const router = useRouter();
  const dispatch = useDispatch();

  // Check for saved payment methods on mount
  useEffect(() => {
    if (isAuthenticated) {
      checkPaymentMethods();
    } else {
      setCheckingPayment(false);
    }
  }, [isAuthenticated]);

  const checkPaymentMethods = async () => {
    setCheckingPayment(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setHasPaymentMethod(false);
        setCheckingPayment(false);
        return;
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/payment-methods`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => ({ data: { data: [] } }));

      // Parse payment methods from different response structures
      let paymentData = [];
      if (response.data) {
        if (Array.isArray(response.data.payment_methods)) {
          paymentData = response.data.payment_methods;
        } else if (response.data.data && Array.isArray(response.data.data.payment_methods)) {
          paymentData = response.data.data.payment_methods;
        } else if (Array.isArray(response.data.data)) {
          paymentData = response.data.data;
        }
      }

      setHasPaymentMethod(paymentData.length > 0);
    } catch {
      setHasPaymentMethod(false);
    } finally {
      setCheckingPayment(false);
    }
  };

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
      if (!checkoutData.paymentMethodId) {
        alert('Please select a payment method before placing an order.');
        return;
      }
      await processInstantCheckout(checkoutData);
      return;
    }

    // Check if user has saved address
    const hasAddress = await checkSavedAddress();
    
    if (hasAddress) {
      setIsModalOpen(true);
    } else {
      router.push('/check-out-delivery');
    }
  };

  const checkSavedAddress = async () => {
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
        currency,
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

  // Button is disabled if: loading, checking payment, or no payment method saved
  const isDisabled = loading || checkingPayment || !hasPaymentMethod;

  return (
    <>
      <div className="relative">
        <Button
          variant="primary"
          onClick={() => handleInstantCheckout()}
          disabled={isDisabled}
          className={className}
          title={!hasPaymentMethod && !checkingPayment ? 'No saved payment method. Please add a payment method first.' : ''}
        >
          {loading ? 'Processing...' : checkingPayment ? 'Checking...' : !hasPaymentMethod ? 'No Payment Method' : 'Instant Checkout'}
        </Button>
        {!hasPaymentMethod && !checkingPayment && (
          <p className="text-xs text-red-500 mt-1 text-center">Add a payment method to use instant checkout</p>
        )}
      </div>

      <InstantCheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={processInstantCheckout}
        items={items}
      />
    </>
  );
}
