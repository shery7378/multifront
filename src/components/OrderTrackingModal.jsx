"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useGetRequest } from "@/controller/getRequests";

export default function OrderTrackingModal({ isOpen, onClose, orderId, trackingId }) {
  const { data, error, loading, sendGetRequest } = useGetRequest();
  const [tick, setTick] = useState(0);

  const endpoint = useMemo(() => {
    if (!isOpen) return null;
    if (orderId) return `/orders/${orderId}/tracking?carrier=shipstation`;
    if (trackingId) return `/tracking/${trackingId}?carrier=shipstation`;
    return null;
  }, [isOpen, orderId, trackingId]);

  useEffect(() => {
    if (!endpoint) return;
    sendGetRequest(endpoint, true);
    const id = setInterval(() => {
      setTick((t) => t + 1);
      sendGetRequest(endpoint, true);
    }, 5000);
    return () => clearInterval(id);
  }, [endpoint]);

  const status = (data?.data?.status || "placed").toLowerCase();
  const etaMinutes = data?.data?.eta_minutes ?? null;
  const trackingNumber = data?.data?.tracking_number;
  const orderStatusLabel = data?.data?.order_status_label;
  const message = data?.data?.message;

  const steps = ["placed", "preparing", "ready", "out_for_delivery", "delivered"];
  const currentIndex = Math.max(0, steps.indexOf(steps.includes(status) ? status : "placed"));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-xl shadow-xl w-[90%] max-w-[480px] p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-2xl font-semibold text-oxford-blue">
            {etaMinutes ? `${etaMinutes} Mints` : "-- Mints"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full grid place-items-center text-oxford-blue/70 hover:bg-gray-100">×</button>
        </div>
        <p className="text-sm text-sonic-silver mb-6">Estimated Arrival Time</p>

        {orderStatusLabel && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-oxford-blue">Order Status: {orderStatusLabel}</p>
          </div>
        )}

        {trackingNumber && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-sonic-silver mb-1">Tracking Number</p>
            <p className="text-sm font-mono text-oxford-blue">{trackingNumber}</p>
          </div>
        )}

        <div className="flex items-center gap-2 mb-2">
          {steps.map((s, i) => (
            <div key={s} className={`h-1 flex-1 ${i <= currentIndex ? "bg-vivid-red" : "bg-gray-200"}`} />
          ))}
        </div>
        <div className="flex items-center justify-between text-[12px] text-oxford-blue/70">
          <span className={`uppercase ${currentIndex >= 0 ? "text-vivid-red font-semibold" : ""}`}>Placed</span>
          <span className="uppercase">Preparing</span>
          <span className="uppercase">Ready</span>
          <span className="uppercase">Out</span>
          <span className="uppercase">Delivered</span>
        </div>

        {message && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{message}</p>
          </div>
        )}

        {loading && <p className="mt-6 text-sm text-oxford-blue/70">Updating...</p>}
        {error && <p className="mt-6 text-sm text-red-500">{String(error)}</p>}
      </div>
    </div>
  );
}
