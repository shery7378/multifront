//src/components/OrderDetails.jsx
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import ResponsiveText from './UI/ResponsiveText';
import Button from './UI/Button';
import { usePromotionsModal } from '@/contexts/PromotionsModalContext';

export default function OrderDetails({ pointsDiscount = 0 }) {
    const { items, appliedCoupon } = useSelector((state) => state.cart);
    const { openModal } = usePromotionsModal();

    // Ensure items is an array and calculate subtotal
    const safeItems = Array.isArray(items) ? items : [];
    const subtotal = safeItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
    // Only show delivery fee and fees when cart has items
    const hasItems = safeItems.length > 0;
    const couponDiscount = Number(appliedCoupon?.discount || 0);
    const hasFreeShipping = Boolean(appliedCoupon?.free_shipping || appliedCoupon?.type === 'free_shipping');
    const deliveryFee = hasItems ? (hasFreeShipping ? 0 : 2.29) : 0;
    const fees = hasItems ? 2.09 : 0;
    const totalDiscount = couponDiscount + pointsDiscount;
    const total = Math.max(0, subtotal + deliveryFee + fees - totalDiscount);
    
    // Debug: log coupon state and calculations
    useEffect(() => {
        console.log('OrderDetails - appliedCoupon from Redux:', appliedCoupon);
        console.log('OrderDetails - Calculations:', {
            subtotal,
            couponDiscount,
            pointsDiscount,
            totalDiscount,
            deliveryFee,
            fees,
            total,
            hasFreeShipping,
        });
    }, [appliedCoupon, subtotal, couponDiscount, pointsDiscount, deliveryFee, fees, total, hasFreeShipping]);

    return (
        <div className="p-4 mt-4 bg-white rounded-lg shadow">
            <ResponsiveText as="h2" minSize="1rem" maxSize="1.375rem" className="font-semibold text-oxford-blue">Order Details</ResponsiveText>

            <div className="mt-2 space-y-2 text-sm text-oxford-blue/60 ">
                <p>Subtotal: <span className="float-right">£{subtotal.toFixed(2)}</span></p>
                <p>Delivery Fee: <span className="float-right">£{deliveryFee.toFixed(2)}</span></p>
                <p>Fees: <span className="float-right">£{fees.toFixed(2)}</span></p>
                {couponDiscount > 0 && (
                    <p>Coupon Discount: <span className="float-right text-vivid-red">− £{couponDiscount.toFixed(2)}</span></p>
                )}
                {pointsDiscount > 0 && (
                    <p>Loyalty Points Discount: <span className="float-right text-purple-600 font-medium">− £{pointsDiscount.toFixed(2)}</span></p>
                )}

                {/* Applied coupon summary */}
                {appliedCoupon && (
                    <div className="mt-2 px-3 py-2 rounded-md bg-emerald-50 border border-emerald-100 text-xs text-emerald-800">
                        <p className="font-medium">
                            Coupon applied
                            {appliedCoupon.code || appliedCoupon.name ? (
                                <span className="ml-1">
                                    ({appliedCoupon.code || appliedCoupon.name})
                                </span>
                            ) : null}
                        </p>
                        {couponDiscount > 0 && (
                            <p>Saving: £{couponDiscount.toFixed(2)}</p>
                        )}
                        {hasFreeShipping && (
                            <p>Free shipping applied</p>
                        )}
                    </div>
                )}

                {/* Promo code button */}
                <div className="mt-3">
                    <Button
                        fullWidth
                        variant="secondary"
                        className="h-10 rounded-md border border-dashed border-vivid-red/60 text-vivid-red text-xs font-medium bg-white hover:bg-vivid-red/5"
                        onClick={openModal}
                    >
                        {appliedCoupon ? 'Change promo code' : 'Have a promo code? Apply it here'}
                    </Button>
                </div>

                <hr className="mt-4 border-t border-dotted border-vivid-red" />
                <p className=" "> <span className="font-poppins text-oxford-blue text-base font-semibold">Total:</span> <span className="float-right text-black font-semibold">£{total.toFixed(2)}</span></p>
            </div>
        </div>
    );
}
