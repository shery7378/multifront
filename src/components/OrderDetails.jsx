//src/components/OrderDetails.jsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ResponsiveText from './UI/ResponsiveText';
import Button from './UI/Button';
import { usePromotionsModal } from '@/contexts/PromotionsModalContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useGetRequest } from '@/controller/getRequests';

export default function OrderDetails({ pointsDiscount = 0 }) {
    const { items, appliedCoupon } = useSelector((state) => state.cart);
    const deliveryOption = useSelector((state) => state.checkout?.deliveryOption) || 'standard';
    const { openModal } = usePromotionsModal();
    const { formatPrice, currency, currencyRates, defaultCurrency } = useCurrency();
    const { data: feesSettingsData, sendGetRequest } = useGetRequest();
    const [deliveryFeeSetting, setDeliveryFeeSetting] = useState(2.00);
    const [standardProductFee, setStandardProductFee] = useState(0.02); // Default 2% commission
    const [standardProductFeeType, setStandardProductFeeType] = useState('percentage');

    // Fetch fees settings from API (public endpoint)
    useEffect(() => {
        sendGetRequest('/admin/product-fees/settings', false, { suppressErrors: true, background: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only fetch once on mount

    // Update settings when data is fetched
    useEffect(() => {
        if (feesSettingsData) {
            // Handle response structure: could be { status: 'success', data: {...} } or just { ... }
            const responseData = feesSettingsData.status === 'success' && feesSettingsData.data 
                ? feesSettingsData.data 
                : feesSettingsData;
            
            if (responseData.delivery_fee !== undefined && responseData.delivery_fee !== null) {
                setDeliveryFeeSetting(Number(responseData.delivery_fee));
            }
            // Use standard_product_fee for commission calculation (matches CheckOutModal logic)
            if (responseData.standard_product_fee !== undefined && responseData.standard_product_fee !== null) {
                setStandardProductFee(Number(responseData.standard_product_fee));
            }
            if (responseData.standard_product_fee_type !== undefined && responseData.standard_product_fee_type !== null) {
                setStandardProductFeeType(responseData.standard_product_fee_type);
            }
        }
    }, [feesSettingsData]);

    // Ensure items is an array and calculate subtotal
    const safeItems = Array.isArray(items) ? items : [];
    const subtotal = Number(safeItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0));
    // Only show delivery fee and fees when cart has items
    const hasItems = safeItems.length > 0;
    const couponDiscount = Number(appliedCoupon?.discount || 0);
    const pointsDiscountNum = Number(pointsDiscount || 0);
    const hasFreeShipping = Boolean(appliedCoupon?.free_shipping || appliedCoupon?.type === 'free_shipping');
    
    // Calculate delivery fee based on selected delivery option and product shipping charges
    // Priority = same_day delivery, Standard = regular delivery
    const calculateDeliveryFee = () => {
        if (!hasItems || hasFreeShipping) return 0;
        
        // Get shipping charge from first product (assuming all products have same charges)
        // Priority option uses shipping_charge_same_day, Standard uses shipping_charge_regular
        const firstItem = safeItems[0];
        const product = firstItem?.product;
        
        let shippingCharge = 0;
        if (deliveryOption === 'priority') {
            shippingCharge = Number(product?.shipping_charge_same_day) || Number(deliveryFeeSetting) || 2.00;
        } else {
            // Standard delivery
            shippingCharge = Number(product?.shipping_charge_regular) || Number(deliveryFeeSetting) || 2.00;
        }
        
        return shippingCharge;
    };
    
    // Base delivery fee and fees in default currency (GBP) - now using dynamic settings
    // Delivery fee changes based on selected delivery option
    const baseDeliveryFee = calculateDeliveryFee();
    // Fees: Use same logic as CheckOutModal - percentage-based commission
    // CheckOutModal uses commissionRate defaulting to 0.02 (2%)
    // If standard_product_fee_type is 'percentage', calculate as percentage of subtotal
    // Default to 0.02 (2%) if not set (matching CheckOutModal behavior)
    const commissionRate = standardProductFeeType === 'percentage' 
        ? (Number(standardProductFee) || 0.02) 
        : 0.02; // Default to 2% commission like CheckOutModal
    const baseFees = hasItems 
        ? (standardProductFeeType === 'percentage' 
            ? subtotal * commissionRate
            : Number(standardProductFee) || 0)
        : 0;
    
    // Convert delivery fee and fees to selected currency if needed
    const deliveryFee = Number(currency !== defaultCurrency && currencyRates[currency] 
        ? baseDeliveryFee * currencyRates[currency] 
        : baseDeliveryFee);
    const fees = Number(currency !== defaultCurrency && currencyRates[currency] 
        ? baseFees * currencyRates[currency] 
        : baseFees);
    
    const totalDiscount = Number(couponDiscount) + Number(pointsDiscountNum);
    const total = Math.max(0, Number(subtotal) + Number(deliveryFee) + Number(fees) - Number(totalDiscount));
    
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
                <p>Subtotal: <span className="float-right">{formatPrice(subtotal)}</span></p>
                <p>Delivery Fee: <span className="float-right">{formatPrice(deliveryFee)}</span></p>
                <p>Fees: <span className="float-right">{formatPrice(fees)}</span></p>
                {couponDiscount > 0 && (
                    <p>Coupon Discount: <span className="float-right text-vivid-red">− {formatPrice(couponDiscount)}</span></p>
                )}
                {pointsDiscount > 0 && (
                    <p>Loyalty Points Discount: <span className="float-right text-purple-600 font-medium">− {formatPrice(pointsDiscount)}</span></p>
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
                            <p>Saving: {formatPrice(couponDiscount)}</p>
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
                <p className=" "> <span className="font-poppins text-oxford-blue text-base font-semibold">Total:</span> <span className="float-right text-black font-semibold">{formatPrice(total)}</span></p>
            </div>
        </div>
    );
}
