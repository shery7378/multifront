'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Button from '@/components/UI/Button';
import axios from 'axios';
import InstantCheckoutModal from './InstantCheckoutModal';

export default function BuyNowButton({ product, quantity = 1, className = '', onSuccess }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const router = useRouter();

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

  const handleBuyNow = async (checkoutData = null) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
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
      router.push(`/check-out-delivery`);
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
        product_id: product.id,
        quantity,
        store_id: product.store_id || product.store?.id,
        currency,
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

  // Button is disabled if: loading, checking payment, or no payment method saved
  const isDisabled = loading || checkingPayment || !hasPaymentMethod;

  return (
    <>
      <div className="relative">
        <Button
          variant="primary"
          onClick={() => handleBuyNow()}
          disabled={isDisabled}
          className={className}
          title={!hasPaymentMethod && !checkingPayment ? 'No saved payment method. Please add a payment method first.' : ''}
        >
          {loading ? 'Processing...' : checkingPayment ? 'Checking...' : !hasPaymentMethod ? 'No Payment Method' : 'Buy Now'}
        </Button>
        {!hasPaymentMethod && !checkingPayment && (
          <p className="text-xs text-red-500 mt-1 text-center">Add a payment method to use Buy Now</p>
        )}
      </div>

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
