//src/app/orders/page.jsx
'use client';
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import NoOrdersYet from "@/components/NoOrdersYet";
import OrderCard from "@/components/OrderCard";
import { useGetRequest } from '@/controller/getRequests';
import axios from 'axios';

export default function OrdersPage() {
  const { token } = useSelector((state) => state.auth);
  const hasLoadedRef = useRef(false);
  const [refundRequestsMap, setRefundRequestsMap] = useState({}); // Map of order_id -> [refund_requests]

  const {
    data,
    error,
    loading,
    sendGetRequest: getData
  } = useGetRequest();

  // Fetch refund requests separately
  useEffect(() => {
    const fetchRefundRequests = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL;
        const authToken = localStorage.getItem('auth_token');
        
        if (!base || !authToken) return;

        const url = `${base.replace(/\/$/, '')}/api/refunds/my-requests`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        // Extract refund requests from response
        let refunds = [];
        if (Array.isArray(response.data)) {
          refunds = response.data;
        } else if (Array.isArray(response.data?.data)) {
          refunds = response.data.data;
        } else if (Array.isArray(response.data?.data?.data)) {
          refunds = response.data.data.data;
        }

        // Group refunds by order_id
        const refundsByOrderId = {};
        refunds.forEach(refund => {
          const orderId = refund.order_id;
          if (!refundsByOrderId[orderId]) {
            refundsByOrderId[orderId] = [];
          }
          refundsByOrderId[orderId].push(refund);
        });

        setRefundRequestsMap(refundsByOrderId);
      } catch (err) {
        console.error('Failed to fetch refund requests:', err);
        // Silently fail - not critical for displaying orders
      }
    };

    if (!hasLoadedRef.current) {
      fetchRefundRequests();
    }
  }, []);

  // Function to refresh orders data in background
  const refreshOrders = () => {
    getData('/orders/my', true, { background: true });
    // Also refresh refund requests
    const fetchRefundRequests = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL;
        const authToken = localStorage.getItem('auth_token');
        
        if (!base || !authToken) return;

        const url = `${base.replace(/\/$/, '')}/api/refunds/my-requests`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${authToken}` }
        });

        let refunds = [];
        if (Array.isArray(response.data)) {
          refunds = response.data;
        } else if (Array.isArray(response.data?.data)) {
          refunds = response.data.data;
        } else if (Array.isArray(response.data?.data?.data)) {
          refunds = response.data.data.data;
        }

        const refundsByOrderId = {};
        refunds.forEach(refund => {
          const orderId = refund.order_id;
          if (!refundsByOrderId[orderId]) {
            refundsByOrderId[orderId] = [];
          }
          refundsByOrderId[orderId].push(refund);
        });

        setRefundRequestsMap(refundsByOrderId);
      } catch (err) {
        console.error('Failed to fetch refund requests:', err);
      }
    };
    fetchRefundRequests();
  };

  useEffect(() => {
    // Fetch orders in background mode - allows UI to render while loading
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      getData('/orders/my', true, { background: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Extract orders from different possible data structures
  const getOrders = () => {
    // Handle different API response structures
    if (Array.isArray(data)) {
      return data;
    } else if (Array.isArray(data?.data)) {
      return data.data;
    } else if (Array.isArray(data?.data?.data)) {
      return data.data.data;
    } else if (Array.isArray(data?.orders)) {
      return data.orders;
    }
    return [];
  };

  const orders = getOrders();

  // Attach refund requests to orders
  const ordersWithRefunds = orders.map(order => ({
    ...order,
    refund_requests: refundRequestsMap[order.id] || order.refund_requests || []
  }));

  // Flatten orders into order-item pairs for display
  const orderItems = ordersWithRefunds.flatMap((order) => {
    // Handle orders with items array
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      return order.items.map((item) => ({
        order,
        item,
        key: `${order.id}-${item.id}`
      }));
    }
    // Handle orders without items (fallback - treat order as item)
    return [{
      order,
      item: order,
      key: `order-${order.id}`
    }];
  });

  const hasOrders = orderItems.length > 0;

  return (
    <>
      <h1 className="px-4 mb-4 text-2xl font-semibold text-oxford-blue">Order</h1>

      {/* Show loading indicator if loading or no data yet (initial state) */}
      {(loading || !data) && !error && (
        <div className="px-4 py-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vivid-red"></div>
            <p className="text-sonic-silver">Loading orders...</p>
          </div>
        </div>
      )}

      {/* Show error message */}
      {error && !data && (
        <div className="px-4 py-4">
          <p className="text-red-500">Failed to load orders: {error}</p>
          <button
            onClick={refreshOrders}
            className="mt-2 px-4 py-2 bg-vivid-red text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Show orders if available */}
      {hasOrders ? (
        <div className="px-4">
          {/* Background loading indicator */}
          {loading && data && (
            <div className="mb-4 text-sm text-sonic-silver flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-vivid-red"></div>
              <span>Updating orders...</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-oxford-blue">
            {orderItems.map(({ order, item, key }) => (
              <OrderCard
                key={key}
                order={order}
                item={item}
                onRefundSubmitted={refreshOrders}
              />
            ))}
          </div>
        </div>
      ) : !loading && !error && data ? (
        // Only show "No orders" if we're not loading, have no error, and actually have data object (empty array)
        <NoOrdersYet />
      ) : null}

    </>
  );
}
