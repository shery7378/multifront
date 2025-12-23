//src/components/OrderCard.jsx
'use client';
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import ResponsiveText from './UI/ResponsiveText';
import { FaArrowUp } from 'react-icons/fa6';
import Button from './UI/Button';
import OrderStatusTracker from './OrderStatusTracker';
import OrderTrackingModal from './OrderTrackingModal';
import RefundRequestModal from './modals/RefundRequestModal';
import PickupQRCode from './QRCode/PickupQRCode';
import ReorderButton from './ReorderButton';
import SubscriptionButton from './Subscriptions/SubscriptionButton';
import { useI18n } from '@/contexts/I18nContext';

export default function OrderCard({ order, item, onRefundSubmitted }) {
  const { t } = useI18n();
    const status = (item?.shipping_status || order?.shipping_status || order?.status || 'preparing');
    const [open, setOpen] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    
    // Check if order is eligible for pickup QR code
    const isPickupOrder = order?.delivery_option === 'pickup' || 
                          item?.delivery_option === 'pickup' ||
                          (order?.note && order.note.toLowerCase().includes('pickup'));
    const trackingId = item?.tracking_id || order?.tracking_id || order?.shipment_id;
    
    // Determine if refund is available (typically for delivered orders or orders that can be cancelled)
    // For testing: Show refund button for all orders. In production, uncomment the strict check below.
    const statusLower = status?.toLowerCase() || '';
    
    // Check if there's already a pending/approved/processing refund request for this order
    const hasExistingRefundRequest = order?.refund_requests && Array.isArray(order.refund_requests) && 
        order.refund_requests.some(refund => 
            ['pending', 'approved', 'processing'].includes(refund.status?.toLowerCase())
        );
    
    const canRequestRefund = !hasExistingRefundRequest && true; // Show for all orders for testing (if no existing request)
    
    // Production version (uncomment when ready):
    // const canRequestRefund = !hasExistingRefundRequest && (['delivered', 'cancelled', 'completed', 'refunded'].includes(statusLower) || 
    //                          order?.status?.toLowerCase() === 'delivered' || 
    //                          item?.shipping_status?.toLowerCase() === 'delivered' ||
    //                          order?.status?.toLowerCase() === 'completed' ||
    //                          order?.status?.toLowerCase() === 'cancelled');
    
    // Debug: Log status values (remove in production)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('Order Status Debug:', {
            orderId: order?.id,
            itemId: item?.id,
            status: status,
            statusLower: statusLower,
            orderStatus: order?.status,
            itemShippingStatus: item?.shipping_status,
            orderShippingStatus: order?.shipping_status,
            canRequestRefund: canRequestRefund
        });
    }
    const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

    const storeLogoPath = order?.store?.logo;
    const storeLogoSrc = storeLogoPath
        ? `${base}/${String(storeLogoPath).replace(/^\/+/, '')}`
        : '/images/stores/default.png';

    const featuredPath = item?.product?.featured_image?.url;
    const productImgSrc = featuredPath
        ? `${base}/${String(featuredPath).replace(/^\/+/, '')}`
        : '/images/products-image/controller3.png';
    return (
        <div className="bg-white border border-[#EDEDED] rounded-xl shadow-sm p-4 max-w-[414px] grid">
            <div className="">
                {/* Store & Order Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="relative w-10 h-10 overflow-hidden rounded-full bg-gray-300">
                            <img
                                src={storeLogoSrc}
                                alt={order?.store?.name || "Store logo"}
                                width={40}
                                height={40}
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-oxford-blue">{order.store?.name}<sup>®</sup></h3>
                            <p className="text-xs text-sonic-silver">{order.store?.full_address}</p>
                        </div>
                    </div>
                    <span className="text-xl text-vivid-red rotate-45">
                        <FaArrowUp />
                    </span>
                </div>

                {/* Product (Order Item) */}
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="relative w-[120px] h-[76px] bg-cultured p-3 flex items-center justify-center">
                        <img
                            src={productImgSrc}
                            alt={item?.product_name || 'Product image'}
                            width={95}
                            height={58}
                            className="object-cover"
                        />
                    </div>
                    <div className="">
                        <div className="mb-1">
                            <p className="text-sm font-medium cursor-pointer select-none" onClick={() => setOpen(true)}>
                                Track My Order <span className="text-vivid-red">({order.order_number})</span>
                            </p>
                        </div>

                        {/* Product Details */}
                        <ResponsiveText as="span" minSize="0.8rem" maxSize="1rem" className="font-medium text-oxford-blue">
                            {item.product_name}
                            <span className="text-vivid-red"> (£{item.product_price})</span>
                        </ResponsiveText>
                        <br />
                        <ResponsiveText as="span" minSize="0.6rem" maxSize="0.8rem" className="text-lg font-semibold text-oxford-blue">
                            {t('common.qty')}: {item.quantity} =
                            <span className="text-vivid-red"> {t('cart.total')}(£{item.subtotal})</span>
                        </ResponsiveText>
                        <p className="text-tiny text-gray-600">
                            {item.attributes?.description?.slice(0, 80)}...
                            <Link href="" className="text-vivid-red hover:underline">
                                {t('common.seeMore')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <div className="self-baseline-last space-y-2">
                <Button
                    variant="secondary"
                    fullWidth
                    className="py-3 rounded-md text-oxford-blue capitalize bg-cultured border border-[#E6E6E6] hover:bg-cultured"
                    onClick={() => setOpen(true)}
                >
                    {order.delivery_option || "Delivery"}
                </Button>
                {isPickupOrder && (
                    <Button
                        variant="primary"
                        fullWidth
                        className="py-3 rounded-md"
                        onClick={() => setIsQRModalOpen(true)}
                    >
                        Show Pickup QR Code
                    </Button>
                )}
                <div className="mt-2">
                    <ReorderButton order={order} className="w-full py-3 rounded-md" />
                </div>
                {/* Subscription Button - Show if product supports subscriptions */}
                {item?.product && item.product.subscription_enabled && (
                    <div className="mt-2">
                        <SubscriptionButton 
                            product={{
                                ...item.product,
                                id: item.product_id || item.product?.id
                            }} 
                            orderId={order?.id}
                            className="w-full py-3 rounded-md"
                        />
                    </div>
                )}
                {canRequestRefund && (
                    <Button
                        variant="outline"
                        fullWidth
                        className="py-3 rounded-md text-vivid-red border border-vivid-red hover:bg-vivid-red/5"
                        onClick={() => setIsRefundModalOpen(true)}
                    >
                        {t('refund.requestRefund')}
                    </Button>
                )}
                {hasExistingRefundRequest && (
                    <div className="py-3 rounded-md text-center text-sm font-medium text-gray-600 border border-gray-300 bg-gray-50">
                        {(() => {
                            const refundRequest = order.refund_requests.find(refund => 
                                ['pending', 'approved', 'processing'].includes(refund.status?.toLowerCase())
                            );
                            const status = refundRequest?.status?.toLowerCase();
                            if (status === 'pending') return 'Refund Request Pending';
                            if (status === 'approved') return 'Refund Approved';
                            if (status === 'processing') return 'Refund Processing';
                            return 'Refund Requested';
                        })()}
                    </div>
                )}
            </div>
            <OrderTrackingModal isOpen={open} onClose={() => setOpen(false)} orderId={order?.id} trackingId={trackingId} />
            <RefundRequestModal
                isOpen={isRefundModalOpen}
                onClose={() => setIsRefundModalOpen(false)}
                orderId={order?.id}
                itemId={item?.id}
                orderNumber={order?.order_number}
                onRefundSubmitted={onRefundSubmitted}
            />
            <PickupQRCode
                isOpen={isQRModalOpen}
                onClose={() => setIsQRModalOpen(false)}
                orderId={order?.id}
            />
        </div>
    );
}
