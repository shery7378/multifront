//src/components/OrderDetails.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import ResponsiveText from './UI/ResponsiveText';
import Button from './UI/Button';
import { usePromotionsModal } from '@/contexts/PromotionsModalContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useGetRequest } from '@/controller/getRequests';
import { groupItemsByStore } from '@/utils/cartUtils';

export default function OrderDetails({ pointsDiscount = 0 }) {
    const { items, appliedCoupon } = useSelector((state) => state.cart);
    const { mode: initialDeliveryMode } = useSelector((state) => state.delivery);
    const checkoutDeliveryOption = useSelector((state) => state.checkout?.deliveryOption);
    
    // Harmonize delivery mode: favor 'pickup' if global mode is set to pickup
    const deliveryOption = initialDeliveryMode === 'pickup' ? 'pickup' : (checkoutDeliveryOption || 'standard');
    const { openModal } = usePromotionsModal();
    const { formatPrice, currency, currencyRates, defaultCurrency } = useCurrency();
    const { data: feesSettingsData, sendGetRequest } = useGetRequest();
    const [apiDeliveryFee, setApiDeliveryFee] = useState(null);
    const [apiProductFee, setApiProductFee] = useState(null);
    const [apiProductFeeType, setApiProductFeeType] = useState('percentage');

    // Fetch fees settings from API (public endpoint)
    useEffect(() => {
        sendGetRequest('/admin/product-fees/settings', false, { suppressErrors: true, background: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only fetch once on mount

    // Update settings when data is fetched
    useEffect(() => {
        if (feesSettingsData) {
            const responseData = feesSettingsData.status === 'success' && feesSettingsData.data 
                ? feesSettingsData.data 
                : feesSettingsData;
            
            if (responseData.delivery_fee !== undefined && responseData.delivery_fee !== null) {
                setApiDeliveryFee(Number(responseData.delivery_fee));
            }
            if (responseData.standard_product_fee !== undefined && responseData.standard_product_fee !== null) {
                setApiProductFee(Number(responseData.standard_product_fee));
            }
            if (responseData.standard_product_fee_type !== undefined && responseData.standard_product_fee_type !== null) {
                setApiProductFeeType(responseData.standard_product_fee_type);
            }
        }
    }, [feesSettingsData]);

    // Ensure items is an array and calculate subtotal
    const safeItems = Array.isArray(items) ? items : [];
    const subtotal = Number(safeItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0));
    const hasItems = safeItems.length > 0;
    const couponDiscount = Number(appliedCoupon?.discount || 0);
    const pointsDiscountNum = Number(pointsDiscount || 0);
    const hasFreeShipping = Boolean(appliedCoupon?.free_shipping || appliedCoupon?.type === 'free_shipping');
    
    // Group items by store (same logic as CheckOutModal)
    const storesGrouped = useMemo(() => groupItemsByStore(safeItems), [safeItems]);
    const storeIds = Object.keys(storesGrouped);
    
    // Calculate delivery fee and fees PER STORE (matching CheckOutModal logic)
    const { baseDeliveryFee, baseFees } = useMemo(() => {
        if (!hasItems || hasFreeShipping) return { baseDeliveryFee: 0, baseFees: 0 };
        
        let totalDeliveryFee = 0;
        let totalFees = 0;
        const processedStores = new Set();
        
        storeIds.forEach(storeId => {
            if (storeId === 'unknown' || processedStores.has(storeId)) return;
            processedStores.add(storeId);
            
            const storeGroup = storesGrouped[storeId];
            const store = storeGroup?.store;
            const storeItems = storeGroup?.items || [];
            
            if (storeItems.length === 0) {
                totalDeliveryFee += apiDeliveryFee ?? 2.29;
                totalFees += 2.09;
                return;
            }
            
            // --- Delivery Fee ---
            // Pick charge based on delivery option (priority = same_day, standard = regular)
            const firstItem = storeItems[0];
            let shippingCharge = 0;
            const resolveFee = (...fees) => {
                for (const f of fees) {
                    if (f !== undefined && f !== null && f !== '') {
                        const num = Number(f);
                        if (!isNaN(num)) return num;
                    }
                }
                return null;
            };
            
            if (deliveryOption === 'priority') {
                const charge = resolveFee(
                    firstItem?.shipping_charge_same_day,
                    firstItem?.product?.shipping_charge_same_day,
                    store?.shipping_charge_same_day,
                    firstItem?.shipping_charge_regular,
                    firstItem?.product?.shipping_charge_regular,
                    store?.shipping_charge_regular
                );
                shippingCharge = charge !== null ? charge : (apiDeliveryFee ?? 2.29);
            } else {
                const charge = resolveFee(
                    firstItem?.shipping_charge_regular,
                    firstItem?.product?.shipping_charge_regular,
                    store?.shipping_charge_regular
                );
                shippingCharge = charge !== null ? charge : (apiDeliveryFee ?? 2.29);
            }
            
            totalDeliveryFee += shippingCharge;
            
            // --- Commission / Platform Fees ---
            const storeSubtotal = storeItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
            
            // Commission rate: product → store → API settings → 2% default
            const commissionRate = Number(firstItem?.product?.commission_rate) ||
                                   Number(store?.commission_rate) ||
                                   (apiProductFeeType === 'percentage' ? (apiProductFee ?? 0.02) : 0.02);
            
            let calculatedFees = 0;
            if (firstItem?.product?.fees && typeof firstItem.product.fees === 'number') {
                calculatedFees = firstItem.product.fees;
            } else if (store?.fees && typeof store.fees === 'number') {
                calculatedFees = store.fees;
            } else if (apiProductFeeType === 'fixed' && apiProductFee !== null) {
                calculatedFees = apiProductFee;
            } else if (commissionRate > 0) {
                calculatedFees = storeSubtotal * commissionRate;
            } else {
                calculatedFees = Math.max(storeSubtotal * 0.02, 2.09);
            }
            
            totalFees += calculatedFees;
        });
        
        // Handle 'unknown' store group if it exists and is the only one
        if (storeIds.length === 1 && storeIds[0] === 'unknown') {
            const storeItems = storesGrouped['unknown']?.items || [];
            if (storeItems.length > 0) {
                const firstItem = storeItems[0];
                
                const resolveFee = (...fees) => {
                    for (const f of fees) {
                        if (f !== undefined && f !== null && f !== '') {
                            const num = Number(f);
                            if (!isNaN(num)) return num;
                        }
                    }
                    return null;
                };
                
                let shippingCharge = 0;
                if (deliveryOption === 'priority') {
                    const charge = resolveFee(
                        firstItem?.product?.shipping_charge_same_day,
                        firstItem?.product?.shipping_charge_regular
                    );
                    shippingCharge = charge !== null ? charge : (apiDeliveryFee ?? 2.29);
                } else {
                    const charge = resolveFee(
                        firstItem?.product?.shipping_charge_regular
                    );
                    shippingCharge = charge !== null ? charge : (apiDeliveryFee ?? 2.29);
                }
                totalDeliveryFee += shippingCharge;
                
                const storeSubtotal = storeItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
                const rate = (apiProductFeeType === 'percentage' ? (Number(apiProductFee ?? 2) / 100) : 0.02);
                totalFees += apiProductFeeType === 'fixed' && apiProductFee !== null
                    ? apiProductFee
                    : storeSubtotal * rate;
            }
        }
        
        return { baseDeliveryFee: totalDeliveryFee, baseFees: totalFees };
    }, [safeItems, storeIds, storesGrouped, deliveryOption, hasItems, hasFreeShipping, apiDeliveryFee, apiProductFee, apiProductFeeType]);
    
    // Convert delivery fee and fees to selected currency if needed
    const deliveryFee = deliveryOption === 'pickup' ? 0 : Number(currency !== defaultCurrency && currencyRates[currency] 
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
                {deliveryOption !== 'pickup' && (
                    <p>Delivery Fee: <span className="float-right">{formatPrice(deliveryFee)}</span></p>
                )}
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
