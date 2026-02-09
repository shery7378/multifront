'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { addItem } from '@/store/slices/cartSlice';
import Button from '@/components/UI/Button';
import { useCartTracking } from '@/hooks/useCartTracking';

export default function CartRecoveryPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartData, setCartData] = useState(null);
  const [discountCode, setDiscountCode] = useState(null);
  const { markAsConverted } = useCartTracking();

  useEffect(() => {
    const recoverCart = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/abandoned-carts/recover/${params.token}`
        );

        const data = await response.json();

        if (data.status === 200) {
          setCartData(data.data.cart_data);
          setDiscountCode(data.data.discount_code);
          
          // Restore cart items to Redux store
          if (data.data.cart_data?.items) {
            data.data.cart_data.items.forEach((item) => {
              dispatch(addItem({
                id: item.id || item.product_id,
                product: item.product || { id: item.id || item.product_id, name: item.name },
                price: item.price,
                quantity: item.quantity,
                color: item.color,
                size: item.size,
                batteryLife: item.battery_life,
                storage: item.storage,
                ram: item.ram,
              }));
            });
          }

          // Store recovery token
          localStorage.setItem('cart_recovery_token', params.token);
        } else {
          setError(data.message || 'Cart not found or expired');
        }
      } catch (err) {
        setError('Failed to recover cart. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (params.token) {
      recoverCart();
    }
  }, [params.token, dispatch]);

  const handleGoToCheckout = () => {
    // Mark as converted will happen when order is placed
    router.push('/check-out-delivery');
  };

  if (loading) {
    return (
      <div className=" flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#F24E2E] mb-4"></div>
          <p className="text-gray-600">Recovering your cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className=" flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Cart Not Found</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/home')} variant="primary">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-green-100 rounded-full p-3 mb-4">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Cart Has Been Restored!</h1>
            <p className="text-gray-600">We've restored your cart items. Ready to complete your purchase?</p>
          </div>

          {discountCode && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-1">🎁 Special Discount Code!</h3>
                  <p className="text-sm text-yellow-700">Use this code at checkout:</p>
                </div>
                <div className="text-right">
                  <div className="bg-white border-2 border-yellow-300 rounded px-4 py-2">
                    <code className="text-lg font-bold text-[#F24E2E]">{discountCode}</code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {cartData && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Cart Items ({cartData.item_count || cartData.items?.length || 0})</h2>
              <div className="space-y-3">
                {cartData.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium">{item.name || item.product?.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-[#F24E2E]">
                    ${cartData.total?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleGoToCheckout}
              variant="primary"
              className="flex-1"
            >
              Proceed to Checkout
            </Button>
            <Button
              onClick={() => router.push('/home')}
              variant="outline"
              className="flex-1"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

