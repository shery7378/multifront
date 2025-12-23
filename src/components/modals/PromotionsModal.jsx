//src/components/modals/PromotionsModal.jsx
'use client';
import React, { useState, useEffect } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { useGetRequest } from '@/controller/getRequests';
import { usePromotionsModal } from '@/contexts/PromotionsModalContext';

export default function PromotionsModal() {
    const { isOpen, closeModal, setIsOpen } = usePromotionsModal();
    const dispatch = useDispatch();
    
    // Listen for custom event as fallback
    useEffect(() => {
        const handleCustomEvent = () => {
            console.log('Custom event received, opening modal');
            setIsOpen(true);
        };
        
        window.addEventListener('openPromotionsModal', handleCustomEvent);
        return () => {
            window.removeEventListener('openPromotionsModal', handleCustomEvent);
        };
    }, [setIsOpen]);
    
    // Debug logging
    useEffect(() => {
        console.log('PromotionsModal isOpen changed:', isOpen);
        if (isOpen) {
            console.log('PromotionsModal should be visible now');
        }
    }, [isOpen]);
    
    const [promoCode, setPromoCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { isAuthenticated } = useSelector((state) => state.auth);
    const cartTotal = useSelector((state) => state.cart?.total ?? 0);
    const { data: assignedCoupons, sendGetRequest: getCoupons } = useGetRequest();

    useEffect(() => {
        if (isOpen && isAuthenticated) {
            // Fetch user's assigned coupons when modal opens
            getCoupons('/account/coupons', true);
        }
    }, [isOpen, isAuthenticated]);

    const handleApply = async () => {
        if (!promoCode.trim()) {
            setError('Please enter a promo code');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        // Use the same base resolution strategy as useGetRequest / other controllers:
        // 1) NEXT_PUBLIC_API_URL if defined
        // 2) Fallback to window.location.origin
        const rawBase =
            process.env.NEXT_PUBLIC_API_URL ||
            (typeof window !== 'undefined' ? window.location.origin : '');
        const base = (rawBase || '').replace(/\/$/, '');

        try {
            const token = typeof window !== 'undefined'
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
                    code: promoCode.trim(),
                    cart_total: cartTotal || 0,
                },
                {
                    withCredentials: true,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
                
                // Debug: log what we're saving
                console.log('Applying coupon to Redux:', couponPayload);
                
                dispatch({
                    type: 'cart/setAppliedCoupon',
                    payload: couponPayload,
                });
                
                // Verify it was saved
                setTimeout(() => {
                    const savedCoupon = JSON.parse(localStorage.getItem('persist:root') || '{}');
                    const cartState = savedCoupon.cart ? JSON.parse(savedCoupon.cart) : null;
                    console.log('Coupon saved in Redux:', cartState?.appliedCoupon);
                }, 100);
                
                setSuccess('Coupon applied successfully!');
                setPromoCode('');
            } else {
                setError('Coupon validated but no discount data returned.');
            }

            // Close modal after 1.5 seconds
            setTimeout(() => {
                closeModal();
                setSuccess('');
            }, 1500);
        } catch (err) {
            const status = err?.response?.status;
            let message =
                err?.response?.data?.message ||
                (typeof err?.response?.data === 'string'
                    ? err.response.data
                    : '');

            if (!message && err?.message === 'Network Error') {
                message =
                    'Network error while contacting the coupon service. Please check that NEXT_PUBLIC_API_URL points to your Laravel backend and that it is running.';
            } else if (!message && status === 419) {
                message =
                    'Your session has expired. Please refresh the page and try again.';
            }

            if (!message) {
                message = 'Failed to apply coupon. Please try again.';
            }

            // Helpful debug in the browser console
            if (typeof window !== 'undefined') {
                // eslint-disable-next-line no-console
                console.error('Coupon apply failed:', {
                    status,
                    url: err?.config?.url,
                    response: err?.response?.data,
                    message,
                });
                // eslint-disable-next-line no-console
                console.error('Coupon apply failed raw error:', err);
            }

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading) {
            handleApply();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={closeModal}
            title="Promotions"
            className="max-w-md p-0 pb-4"
            showCloseButton={true}
            titleClassName="py-4"
        >
            <div className="grid h-full items-center gap-6 px-4">
                {/* Show assigned coupons if user is logged in */}
                {isAuthenticated && assignedCoupons?.data?.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-oxford-blue mb-2">Your Available Coupons</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {assignedCoupons.data.map((coupon) => (
                                <div
                                    key={coupon.id}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                                >
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-oxford-blue">{coupon.name}</p>
                                        <p className="text-xs text-gray-600">
                                            {coupon.is_percent ? `${coupon.value}%` : `$${coupon.value}`} off
                                        </p>
                                    </div>
                                    <code className="text-xs bg-white px-2 py-1 rounded border">{coupon.code}</code>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="relative flex items-center">
                    <Input
                        name="promoCode"
                        value={promoCode}
                        onChange={(e) => {
                            setPromoCode(e.target.value);
                            setError('');
                            setSuccess('');
                        }}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter promo code"
                        className="w-full h-14 border bg-ghost-white border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vivid-red/60"
                        inputClassName="pr-20 h-14 border-0"
                        disabled={loading}
                    />
                    <Button
                        variant="primary"
                        className="absolute right-0 px-4 !h-14 rounded-md"
                        onClick={handleApply}
                        disabled={loading || !promoCode.trim()}
                    >
                        {loading ? 'Applying...' : 'Apply'}
                    </Button>
                </div>

                {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                        {success}
                    </div>
                )}

                <div className="">
                    <Button 
                        fullWidth 
                        variant="primary" 
                        className="rounded-md h-[60px]"
                        onClick={closeModal}
                    >
                        Done
                    </Button>
                </div>
            </div>
        </Modal>
    );
}