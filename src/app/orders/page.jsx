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
  const [refundRequestsMap, setRefundRequestsMap] = useState({});

  const {
    data,
    error,
    loading,
    sendGetRequest: getData
  } = useGetRequest();

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

  useEffect(() => {
    if (!hasLoadedRef.current) {
      fetchRefundRequests();
    }
  }, []);

  const refreshOrders = () => {
    getData('/orders/my', true, { background: true });
    fetchRefundRequests();
  };

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      getData('/orders/my', true, { background: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getOrders = () => {
    if (Array.isArray(data)) return data;
    else if (Array.isArray(data?.data)) return data.data;
    else if (Array.isArray(data?.data?.data)) return data.data.data;
    else if (Array.isArray(data?.orders)) return data.orders;
    return [];
  };

  const orders = getOrders();

  const ordersWithRefunds = orders.map(order => ({
    ...order,
    refund_requests: refundRequestsMap[order.id] || order.refund_requests || []
  }));

  const orderItems = ordersWithRefunds.flatMap((order) => {
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      return order.items.map((item) => ({
        order,
        item,
        key: `${order.id}-${item.id}`
      }));
    }
    return [{ order, item: order, key: `order-${order.id}` }];
  });

  const hasOrders = orderItems.length > 0;

  if ((loading || !data) && !error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative mb-4">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#F44322] rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-500 font-medium">Loading orders...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 text-center">
        <p className="text-red-500 mb-4">Failed to load orders: {error}</p>
        <button
          onClick={refreshOrders}
          className="px-4 py-2 bg-[#F44322] text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
      <h1 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-oxford-blue">Order</h1>

      {hasOrders ? (
        <>
          {loading && data && (
            <div className="mb-3 sm:mb-4 text-xs sm:text-sm text-sonic-silver flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-vivid-red"></div>
              <span>Updating orders...</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 text-oxford-blue">
            {orderItems.map(({ order, item, key }) => (
              <OrderCard
                key={key}
                order={order}
                item={item}
                onRefundSubmitted={refreshOrders}
              />
            ))}
          </div>
        </>
      ) : (
        <NoOrdersYet />
      )}
    </div>
  );
}