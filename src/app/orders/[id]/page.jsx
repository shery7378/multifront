'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetRequest } from '@/controller/getRequests';
import { useSelector } from 'react-redux';
import BackButton from '@/components/UI/BackButton';
import ResponsiveText from '@/components/UI/ResponsiveText';
import { useCurrency } from '@/contexts/CurrencyContext';
import Image from 'next/image';
// Using native JavaScript date formatting instead of date-fns

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id;
  const { formatPrice } = useCurrency();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const {
    data: orderData,
    error,
    loading,
    sendGetRequest: getOrder,
  } = useGetRequest();

  const {
    data: relatedOrdersData,
    sendGetRequest: getRelatedOrders,
  } = useGetRequest();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(`/orders/${orderId}`));
      return;
    }

    if (orderId) {
      console.log('Fetching order:', orderId);
      getOrder(`/orders/${orderId}`, true);
    }
    
    // Cleanup: prevent memory leaks
    return () => {
      // Any cleanup if needed
    };
  }, [orderId, isAuthenticated, router, getOrder]);

  // Fetch related orders (orders created at the same time from same checkout)
  useEffect(() => {
    if (orderData?.data) {
      const order = orderData.data;
      const orderDate = order.created_at;
      // Fetch all user orders to find related ones (created within 10 seconds)
      if (orderDate) {
        getRelatedOrders(`/orders/my`, true);
      }
    }
  }, [orderData, getRelatedOrders]);

  // Debug logging
  useEffect(() => {
    if (orderData) {
      console.log('Order data received:', orderData);
    }
    if (error) {
      console.error('Order fetch error:', error);
    }
  }, [orderData, error]);

  if (loading && !orderData && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-oxford-blue mb-2">Loading order details...</p>
          <p className="text-sm text-gray-500">Order ID: {orderId}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">Failed to load order: {error}</p>
        <button
          onClick={() => router.push('/orders')}
          className="px-4 py-2 bg-vivid-red text-white rounded-lg"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  // Extract order from different response structures
  // OrderResource with ->additional() returns: { data: {...}, status: 200, message: "..." }
  // So order is at orderData.data
  const order = orderData?.data || orderData;
  
  console.log('Extracted order:', order);
  console.log('Order items:', order?.items);
  console.log('Order items length:', order?.items?.length);
  console.log('Order product_detail:', order?.product_detail);
  console.log('Order product_detail type:', typeof order?.product_detail);
  console.log('Order product_detail length:', Array.isArray(order?.product_detail) ? order?.product_detail.length : 'not array');
  
  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-oxford-blue mb-4">Order not found</p>
        <button
          onClick={() => router.push('/orders')}
          className="px-4 py-2 bg-vivid-red text-white rounded-lg"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  // Handle items - could be array of OrderItemResource or product_detail array
  let items = [];
  
  // First, try to get items from the items relationship (OrderItemResource collection)
  // This is the primary source - each order should have multiple OrderItem records
  if (Array.isArray(order.items)) {
    if (order.items.length > 0) {
      items = order.items;
      console.log('✅ Using order.items:', items.length, 'items found');
    } else {
      console.warn('⚠️ order.items is an empty array');
    }
  } else {
    console.warn('⚠️ order.items is not an array:', typeof order.items, order.items);
  }
  
  // If items is still empty, try product_detail as fallback
  if (items.length === 0) {
    if (Array.isArray(order.product_detail) && order.product_detail.length > 0) {
      // If product_detail is an array, convert it to items format
      items = order.product_detail.map((detail, index) => ({
        id: detail.id || detail.product_id || index,
        product_id: detail.product_id,
        product_name: detail.name || detail.product_name || detail.product_detail?.name,
        quantity: detail.quantity || detail.product_detail?.quantity || 1,
        product_price: detail.price || detail.product_price || detail.product_detail?.price,
        subtotal: (detail.price || detail.product_price || detail.product_detail?.price || 0) * (detail.quantity || detail.product_detail?.quantity || 1),
        product: detail.product || detail.product_detail || {},
      }));
      console.log('✅ Using order.product_detail as fallback:', items.length, 'items');
    }
    // If product_detail is a string (JSON), parse it
    else if (typeof order.product_detail === 'string' && order.product_detail.trim()) {
      try {
        const parsed = JSON.parse(order.product_detail);
        if (Array.isArray(parsed) && parsed.length > 0) {
          items = parsed.map((detail, index) => ({
            id: detail.id || detail.product_id || index,
            product_id: detail.product_id,
            product_name: detail.name || detail.product_name || detail.product_detail?.name,
            quantity: detail.quantity || detail.product_detail?.quantity || 1,
            product_price: detail.price || detail.product_price || detail.product_detail?.price,
            subtotal: (detail.price || detail.product_price || detail.product_detail?.price || 0) * (detail.quantity || detail.product_detail?.quantity || 1),
            product: detail.product || detail.product_detail || {},
          }));
          console.log('✅ Parsed product_detail JSON:', items.length, 'items');
        }
      } catch (e) {
        console.error('❌ Failed to parse product_detail:', e);
      }
    }
  }
  
  console.log('📦 Final items array:', items);
  console.log('📦 Items count:', items.length);
  console.log('📦 Order structure:', {
    hasItems: !!order.items,
    itemsIsArray: Array.isArray(order.items),
    itemsLength: Array.isArray(order.items) ? order.items.length : 'N/A',
    hasProductDetail: !!order.product_detail,
    productDetailType: typeof order.product_detail,
    productDetailIsArray: Array.isArray(order.product_detail),
    productDetailLength: Array.isArray(order.product_detail) ? order.product_detail.length : 'N/A',
  });
  
  // Get related orders from the same checkout session (created within 10 seconds)
  let allRelatedOrders = [];
  let allItemsFromAllOrders = [...items];
  
  if (relatedOrdersData?.data) {
    const orders = Array.isArray(relatedOrdersData.data) ? relatedOrdersData.data : [];
    const currentOrderDate = order.created_at ? new Date(order.created_at) : null;
    
    if (currentOrderDate) {
      // Find orders created within 10 seconds of the current order (same checkout session)
      allRelatedOrders = orders.filter(relatedOrder => {
        if (relatedOrder.id === order.id) return false; // Exclude current order
        const relatedDate = relatedOrder.created_at ? new Date(relatedOrder.created_at) : null;
        if (!relatedDate) return false;
        const timeDiff = Math.abs(relatedDate.getTime() - currentOrderDate.getTime());
        return timeDiff <= 10000; // 10 seconds
      });
      
      // Collect all items from related orders
      allRelatedOrders.forEach(relatedOrder => {
        if (Array.isArray(relatedOrder.items) && relatedOrder.items.length > 0) {
          allItemsFromAllOrders = [...allItemsFromAllOrders, ...relatedOrder.items];
        } else if (Array.isArray(relatedOrder.product_detail) && relatedOrder.product_detail.length > 0) {
          const convertedItems = relatedOrder.product_detail.map((detail, index) => ({
            id: detail.id || detail.product_id || `related-${relatedOrder.id}-${index}`,
            product_id: detail.product_id,
            product_name: detail.name || detail.product_name || detail.product_detail?.name,
            quantity: detail.quantity || detail.product_detail?.quantity || 1,
            product_price: detail.price || detail.product_price || detail.product_detail?.price,
            subtotal: (detail.price || detail.product_price || detail.product_detail?.price || 0) * (detail.quantity || detail.product_detail?.quantity || 1),
            product: detail.product || detail.product_detail || {},
            order_number: relatedOrder.order_number,
            store_id: relatedOrder.store_id,
            store: relatedOrder.store,
          }));
          allItemsFromAllOrders = [...allItemsFromAllOrders, ...convertedItems];
        }
      });
    }
  }
  
  console.log('📦 Related orders found:', allRelatedOrders.length);
  console.log('📦 All items from all related orders:', allItemsFromAllOrders.length);
  
  // Use all items from all related orders if we found related orders
  const displayItems = allRelatedOrders.length > 0 ? allItemsFromAllOrders : items;
  
  const orderDate = order.created_at ? new Date(order.created_at) : new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <BackButton onClick={() => router.push('/orders')} />
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-4">
          {/* Order Header */}
          <div className="border-b border-gray-200 pb-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <ResponsiveText
                  as="h1"
                  minSize="1.5rem"
                  maxSize="2rem"
                  className="font-bold text-oxford-blue mb-2"
                >
                  Order #{order.order_number || order.id}
                </ResponsiveText>
                <p className="text-sm text-gray-600">
                  Placed on {orderDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {order.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.payment_status === 'done' || order.payment_status === 'paid' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.payment_status?.toUpperCase() || 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* Related Orders Notice */}
          {allRelatedOrders.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This checkout included {allRelatedOrders.length + 1} order{allRelatedOrders.length + 1 !== 1 ? 's' : ''} from different stores. 
                Showing all items below.
              </p>
            </div>
          )}

          {/* Order Items */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-oxford-blue mb-4">
              Order Items {allRelatedOrders.length > 0 && `(${displayItems.length} items from ${allRelatedOrders.length + 1} orders)`}
            </h2>
            <div className="space-y-4">
              {Array.isArray(displayItems) && displayItems.length > 0 ? (
                displayItems.map((item, index) => {
                  console.log(`Rendering item ${index}:`, item);
                  const product = item.product || {};
                  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
                  
                  // Debug logging
                  console.log('Order item product:', product);
                  console.log('Featured image:', product.featured_image);
                  
                  // Get image path - check multiple possible locations
                  const featuredPath = product.featured_image?.url || 
                                      product.featured_image?.path ||
                                      product.image || 
                                      product.images?.[0]?.url ||
                                      product.images?.[0]?.path ||
                                      null;
                  
                  console.log('Featured path:', featuredPath);
                  
                  // Build absolute URL
                  const productImage = featuredPath
                    ? `${base}/${String(featuredPath).replace(/^\/+/, '')}`
                    : '/images/NoImageLong.jpg';
                  
                  console.log('Final product image URL:', productImage);
                  
                  // Get product name from multiple possible locations
                  const productName = product.name || item.product_name || item.name || 'Product';
                  // Get quantity
                  const quantity = item.quantity || 1;
                  // Get price - check multiple locations
                  const unitPrice = item.product_price || item.price || product.price || 0;
                  const subtotal = item.subtotal || (unitPrice * quantity);
                  
                  // Get store info if available
                  const storeInfo = item.store || order.store || {};
                  
                  return (
                    <div key={item.id || `item-${index}`} className="flex gap-4 p-4 border border-gray-200 rounded-lg relative">
                      {item.order_number && item.order_number !== order.order_number && (
                        <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          Order: {item.order_number}
                        </div>
                      )}
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        {productImage && productImage !== '/images/NoImageLong.jpg' ? (
                          <img
                            src={productImage}
                            alt={productName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image failed to load:', productImage);
                              e.target.src = '/images/NoImageLong.jpg';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-oxford-blue mb-1">
                          {productName}
                        </h3>
                        {storeInfo.name && storeInfo.name !== order.store?.name && (
                          <p className="text-xs text-blue-600 mb-1 font-medium">
                            Store: {storeInfo.name}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mb-2">
                          Quantity: {quantity}
                        </p>
                        <p className="text-lg font-bold text-vivid-red">
                          {formatPrice(subtotal)}
                        </p>
                        {item.product_sku && (
                          <p className="text-xs text-gray-500 mt-1">
                            SKU: {item.product_sku}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No items found in this order.</p>
                  <p className="text-xs text-gray-400">
                    Order data: {JSON.stringify(order, null, 2).substring(0, 200)}...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-oxford-blue mb-4">Order Summary</h2>
            <div className="space-y-2">
              {(() => {
                // Helper to safely convert to number
                const toNumber = (val) => {
                  if (val === null || val === undefined) return 0;
                  const num = typeof val === 'string' ? parseFloat(val) : Number(val);
                  return isNaN(num) ? 0 : num;
                };
                
                // Calculate totals from all items if we have related orders
                let subtotal = 0;
                let totalShipping = 0;
                let totalDiscount = 0;
                
                if (allRelatedOrders.length > 0) {
                  // Calculate from all items
                  displayItems.forEach(item => {
                    const itemSubtotal = toNumber(item.subtotal);
                    const itemPrice = toNumber(item.product_price);
                    const itemQty = toNumber(item.quantity);
                    subtotal += itemSubtotal || (itemPrice * itemQty);
                  });
                  // Sum shipping from current order and related orders
                  totalShipping = toNumber(order.shipping_fee);
                  allRelatedOrders.forEach(relOrder => {
                    totalShipping += toNumber(relOrder.shipping_fee);
                  });
                  // Sum discounts
                  totalDiscount = toNumber(order.discount);
                  allRelatedOrders.forEach(relOrder => {
                    totalDiscount += toNumber(relOrder.discount);
                  });
                } else {
                  // Single order calculation
                  // Backend stores: price = subtotal - discounts (excluding shipping)
                  // So: subtotal = price + discounts
                  const orderPrice = toNumber(order.price);
                  const orderShipping = toNumber(order.shipping_fee);
                  const orderDiscount = toNumber(order.discount);
                  
                  // Calculate subtotal by reversing the backend formula
                  // Backend: price = subtotal - discount, so subtotal = price + discount
                  subtotal = orderPrice + orderDiscount;
                  totalShipping = orderShipping;
                  totalDiscount = orderDiscount;
                  
                  // Alternative: Calculate from items if available (more accurate)
                  if (displayItems.length > 0) {
                    const itemsSubtotal = displayItems.reduce((sum, item) => {
                      const itemSubtotal = toNumber(item.subtotal);
                      const itemPrice = toNumber(item.product_price);
                      const itemQty = toNumber(item.quantity);
                      return sum + (itemSubtotal || (itemPrice * itemQty));
                    }, 0);
                    if (itemsSubtotal > 0) {
                      subtotal = itemsSubtotal;
                    }
                  }
                }
                
                // Total = subtotal + shipping - discount
                const total = subtotal + totalShipping - totalDiscount;
                
                console.log('Order Summary Calculation:', {
                  subtotal,
                  totalShipping,
                  totalDiscount,
                  total,
                  hasRelatedOrders: allRelatedOrders.length > 0,
                  displayItemsCount: displayItems.length,
                });
                
                return (
                  <>
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal:</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {totalShipping > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Shipping:</span>
                        <span>{formatPrice(totalShipping)}</span>
                      </div>
                    )}
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Discount:</span>
                        <span>-{formatPrice(totalDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-oxford-blue pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-lg font-semibold text-oxford-blue mb-4">Shipping Address</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {order.shipping_address}
              </p>
            </div>
          )}

          {/* Delivery Option */}
          {order.delivery_option && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-lg font-semibold text-oxford-blue mb-2">Delivery Option</h2>
              <p className="text-gray-700 capitalize">
                {order.delivery_option}
              </p>
            </div>
          )}

          {/* Shipping Status */}
          {order.shipping_status && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-lg font-semibold text-oxford-blue mb-2">Shipping Status</h2>
              <p className="text-gray-700 capitalize">
                {order.shipping_status}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

