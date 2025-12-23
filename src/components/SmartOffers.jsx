'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useGetRequest } from '@/controller/getRequests';
import { setAppliedCoupon } from '@/store/slices/cartSlice';
import axios from 'axios';
import Button from './UI/Button';
import { useI18n } from '@/contexts/I18nContext';

export default function SmartOffers({ className = '' }) {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart?.items ?? []);
  const cartTotal = useSelector((state) => state.cart?.total ?? 0);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applyingCode, setApplyingCode] = useState(null);
  const { data, error, sendGetRequest } = useGetRequest();

  useEffect(() => {
    fetchSmartOffers();
  }, [token]);

  // Clear offers when cart is emptied
  useEffect(() => {
    if (cartItems.length === 0) {
      setOffers([]);
      console.log('🛒 Cart is empty, clearing offers');
    }
  }, [cartItems.length]);

  useEffect(() => {
    if (data?.data) {
      // Only update offers if cart has items
      if (cartItems.length > 0) {
        setOffers(data.data.all_offers || []);
      } else {
        setOffers([]);
      }
    } else if (error) {
      // Handle errors gracefully - 401 is expected for unauthenticated users
      setOffers([]);
    }
  }, [data, error, cartItems.length]);

  const fetchSmartOffers = async () => {
    try {
      setLoading(true);
      const postcode = localStorage.getItem('postcode');
      const city = localStorage.getItem('city');
      const lat = localStorage.getItem('lat');
      const lng = localStorage.getItem('lng');

      const params = new URLSearchParams();
      if (postcode) params.append('postcode', postcode);
      if (city) params.append('city', city);
      if (lat) params.append('lat', lat);
      if (lng) params.append('lng', lng);

      await sendGetRequest(`/smart-offers?${params.toString()}`, !!token, { suppressAuthErrors: true });
    } catch (error) {
      console.error('Failed to fetch smart offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async (couponCode) => {
    if (!couponCode || applyingCode === couponCode) return;

    setApplyingCode(couponCode);

    // Use the same base resolution strategy as PromotionsModal
    const rawBase =
      process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    const base = (rawBase || '').replace(/\/$/, '');

    try {
      const tokenValue = typeof window !== 'undefined'
        ? localStorage.getItem('auth_token')
        : null;

      // Get CSRF token first (needed for Sanctum / session auth)
      await axios.get(`${base}/sanctum/csrf-cookie`, {
        withCredentials: true,
      });

      // Apply coupon via API route
      const couponUrl = `${base}/api/coupons/validate`;
      const response = await axios.post(
        couponUrl,
        {
          code: couponCode.trim(),
          cart_total: cartTotal || 0,
        },
        {
          withCredentials: true,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {}),
          },
        },
      );

      // Response shape from API\CouponController@validateCoupon
      const couponData = response?.data?.data || null;

      if (couponData) {
        const couponPayload = {
          code: couponData.code,
          type: couponData.type,
          value: couponData.value,
          discount: couponData.discount,
          free_shipping: couponData.free_shipping,
        };

        console.log('✅ Applying coupon:', couponPayload);

        dispatch(setAppliedCoupon(couponPayload));

        // Show success feedback (optional: you could add a toast notification here)
        console.log('Coupon applied successfully!');
      } else {
        console.error('❌ Coupon validated but no discount data returned.');
        alert('Failed to apply coupon. Please try again.');
      }
    } catch (err) {
      const status = err?.response?.status;
      const message =
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string'
          ? err.response.data
          : 'Failed to apply coupon. Please try again.');

      console.error('❌ Coupon apply failed:', {
        status,
        url: err?.config?.url,
        response: err?.response?.data,
        message,
      });

      alert(message || 'Failed to apply coupon. Please try again.');
    } finally {
      setApplyingCode(null);
    }
  };

  // Helper function to safely extract numeric value from offer
  const getOfferValue = (offer) => {
    if (typeof offer?.value === 'number') {
      return offer.value;
    }
    if (typeof offer?.value === 'object' && offer.value !== null) {
      // If value is an object, try to extract the numeric value
      return Number(offer.value.value ?? offer.value.amount ?? offer.value) || 0;
    }
    return Number(offer?.value) || 0;
  };

  // Helper function to format offer discount display
  const formatOfferDiscount = (offer) => {
    const value = getOfferValue(offer);
    if (offer?.is_percent) {
      return `${value}%`;
    }
    return `$${value.toFixed(2)}`;
  };

  // Don't show offers if cart is empty or if loading
  if (loading || cartItems.length === 0 || !offers || offers.length === 0) {
    return null;
  }

  const smartOffer = data?.data?.smart_offer;

  return (
    <div className={`space-y-3 ${className}`}>
      {smartOffer && (
        <div className="bg-gradient-to-r from-[#F24E2E] to-red-600 rounded-lg p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">🎁 Special Offer for Your Area!</h3>
              <p className="text-sm opacity-90 mb-2">{smartOffer.description || 'Exclusive discount for your location'}</p>
              <div className="flex items-center gap-2">
                <code className="bg-white/20 px-3 py-1 rounded font-mono text-sm font-bold">
                  {smartOffer.code}
                </code>
                <span className="text-sm font-semibold">
                  Save {formatOfferDiscount(smartOffer)}
                </span>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => handleApplyCoupon(smartOffer.code)}
              className="bg-white text-[#F24E2E] hover:bg-gray-100"
              disabled={applyingCode === smartOffer.code}
            >
              {applyingCode === smartOffer.code ? 'Applying...' : 'Apply'}
            </Button>
          </div>
        </div>
      )}

      {offers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-semibold text-blue-900 mb-2 text-sm">Available Offers</h4>
          <div className="space-y-2">
            {offers.slice(0, 3).map((offer, index) => (
              <div
                key={offer.id || index}
                className="flex items-center justify-between bg-white rounded p-2"
              >
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{offer.code}</span>
                  <span className="text-xs text-gray-600 ml-2">
                    - {formatOfferDiscount(offer)} off
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyCoupon(offer.code)}
                  className="text-xs px-2 py-1"
                  disabled={applyingCode === offer.code}
                >
                  {applyingCode === offer.code ? 'Applying...' : 'Apply'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

