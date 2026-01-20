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

    // Check if there's already ANY refund request for this order (pending, approved, processing, rejected, completed, cancelled)
    // Once a refund request exists, we don't allow creating a new one
    const hasExistingRefundRequest = order?.refund_requests && Array.isArray(order.refund_requests) &&
        order.refund_requests.some(refund =>
            ['pending', 'approved', 'processing', 'rejected', 'completed', 'cancelled'].includes(refund.status?.toLowerCase())
        );

    // Only show refund button when shipping_status is completed AND no refund request exists
    const canRequestRefund = !hasExistingRefundRequest && order?.shipping_status?.toLowerCase() === 'completed';

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

    // Debug: Log item structure to understand data format
    // Expand the product object to see ALL fields
    const productDebug = item?.product ? {
        ...item.product,
        // Show all keys
        _keys: Object.keys(item.product),
        // Check image in various formats
        image_direct: item.product.image,
        image_from_featured: item.product.featured_image?.url,
        image_from_images_array: item.product.images?.[0]?.url,
    } : null;

    console.log('OrderCard - Item data (EXPANDED):', {
        itemId: item?.id,
        product_id: item?.product_id,
        variant_id: item?.variant_id,
        product_name: item?.product_name,
        hasProduct: !!item?.product,
        hasVariant: !!item?.variant,
        variant: item?.variant,
        product: productDebug, // Full expanded product
    });

    // Get product image - Priority: variant.image > images table > product.image > fallbacks
    const product = item?.product || item;
    const variant = item?.variant || product?.variant;

    // Priority 1: Try variant image first (from product_variants table)
    let featuredPath = variant?.image ||
        variant?.variant_image ||
        null;

    // Priority 2: Try images table (featured_image or first image)
    if (!featuredPath) {
        // Check featured_image from images table
        featuredPath = product?.featured_image?.url ||
            product?.featured_image?.path ||
            null;

        // If no featured_image, try first image from images array
        if (!featuredPath && product?.images && Array.isArray(product.images) && product.images.length > 0) {
            featuredPath = product.images[0]?.url || product.images[0]?.path || null;
        }
    }

    // Priority 3: Try product image (from products.image column)
    if (!featuredPath) {
        featuredPath = product?.image || null;
    }

    // Priority 4: Last resort fallbacks
    if (!featuredPath) {
        featuredPath = product?.gallery_images?.[0]?.url ||
            product?.gallery_images?.[0]?.path ||
            item?.image ||
            item?.product_image ||
            null;
    }

    // Build product image URL - handle both relative and absolute URLs
    let productImgSrc = '/images/NoImageLong.jpg'; // Generic placeholder
    if (featuredPath) {
        const pathStr = String(featuredPath).trim();

        // Remove any leading slashes that might cause double slashes
        const cleanPath = pathStr.replace(/^\/+/, '');

        if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
            // Already a full URL
            productImgSrc = pathStr;
        } else if (pathStr.startsWith('/')) {
            // Absolute path from root - prepend base URL (ensure no double slash)
            productImgSrc = `${base}${pathStr}`;
        } else {
            // Relative path - prepend base URL with single slash
            productImgSrc = base ? `${base}/${cleanPath}` : `/${cleanPath}`;
        }
    }

    // Debug: Log final image URL (always log for debugging)
    console.log('OrderCard - Image path resolution:', {
        itemId: item?.id,
        productId: product?.id,
        variantId: variant?.id,
        productName: product?.name || item?.product_name,
        hasProduct: !!product,
        hasVariant: !!variant,
        productImage: product?.image, // From products.image column
        variantImage: variant?.image, // From product_variants.image column
        hasFeaturedImage: !!product?.featured_image,
        featuredImageUrl: product?.featured_image?.url,
        hasImages: !!product?.images,
        imagesCount: product?.images?.length || 0,
        firstImageUrl: product?.images?.[0]?.url,
        featuredPath,
        productImgSrc,
        base,
        // Show all product keys to see what's available
        productKeys: product ? Object.keys(product) : [],
        // Show full product object (first level only)
        productObject: product ? JSON.parse(JSON.stringify(product)) : null,
    });
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
                    <Link
                        href={`/product/${item.product_id || item.product?.id || item.id}`}
                        className="text-xl text-vivid-red rotate-45 hover:opacity-80 transition-opacity cursor-pointer"
                        title="View Product"
                    >
                        <FaArrowUp />
                    </Link>
                </div>

                {/* Product (Order Item) */}
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="relative w-[120px] h-[76px] bg-cultured p-3 flex items-center justify-center overflow-hidden rounded">
                        <img
                            src={productImgSrc}
                            alt={item?.product_name || 'Product image'}
                            width={95}
                            height={58}
                            className="object-contain w-full h-full"
                            onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                console.error('OrderCard - Image failed to load:', {
                                    attemptedUrl: productImgSrc,
                                    productName: item?.product_name,
                                    productId: product?.id,
                                });
                                // Only change if not already the placeholder
                                if (e.target.src && !e.target.src.includes('NoImageLong.jpg')) {
                                    e.target.src = '/images/NoImageLong.jpg';
                                }
                            }}
                            onLoad={() => {
                                console.log('OrderCard - Image loaded successfully:', productImgSrc);
                            }}
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
                            <Link
                                href={`/product/${item.product_id || item.product?.id || item.id}`}
                                className="text-vivid-red hover:underline"
                            >
                                {t('common.seeMore')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <div className="self-baseline-last space-y-2">
                {/* Show status - Delivered if completed, otherwise show delivery option */}
                <Button
                    variant="secondary"
                    fullWidth
                    className="py-3 rounded-md text-oxford-blue capitalize bg-cultured border border-[#E6E6E6] hover:bg-cultured"
                    onClick={() => setOpen(true)}
                >
                    {order?.shipping_status?.toLowerCase() === 'completed' ? 'Delivered ✓' : (order.delivery_option || "Delivery")}
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
                            // Get the most recent refund request or any existing one
                            const refundRequest = order.refund_requests?.find(refund =>
                                ['pending', 'approved', 'processing', 'rejected', 'completed', 'cancelled'].includes(refund.status?.toLowerCase())
                            ) || order.refund_requests?.[0];
                            const status = refundRequest?.status?.toLowerCase();
                            if (status === 'pending') return 'Refund Request Pending';
                            if (status === 'approved') return 'Refund Approved';
                            if (status === 'processing') return 'Refund Processing';
                            if (status === 'rejected') return 'Refund Request Rejected';
                            if (status === 'completed') return 'Refund Completed';
                            if (status === 'cancelled') return 'Refund Cancelled';
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
