//src/app/orders/page.jsx
'use client';
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import NoOrdersYet from "@/components/NoOrdersYet";
import OrderCard from "@/components/OrderCard";
import { useGetRequest } from '@/controller/getRequests';
import ResponsiveText from "@/components/UI/ResponsiveText";

export default function OrdersPage() {
  const { token } = useSelector((state) => state.auth);
  const hasLoadedRef = useRef(false);

  const {
    data,
    error,
    loading,
    sendGetRequest: getData
  } = useGetRequest();

  // Function to refresh orders data
  const refreshOrders = () => {
    getData('/orders/my', true);
  };

  useEffect(() => {
    // Only fetch once on component mount - no automatic reloading
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      getData('/orders/my', true);
    }
    
    // No automatic polling or visibility change listeners
    // Orders will only load once when the page is visited
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount
  console.log(data, 'orders data');
  // UI rendering logic
  if (loading) {
    return <p className="px-4">Loading orders...</p>;
  }

  if (error) {
    return <p className="px-4 text-red-500">Failed to load orders: {error}</p>;
  }

  return (
    <>
      <h1 className="px-4 mb-4 text-2xl font-semibold text-oxford-blue">Order</h1>

      {Array.isArray(data?.data) && data.data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-oxford-blue">
          {data.data.map((order) =>
            order.items.map((item) => (
              <OrderCard key={item.id} order={order} item={item} onRefundSubmitted={refreshOrders} />
            ))
          )}
        </div>
      ) : (
        <NoOrdersYet />
      )}

    </>
  );
}
