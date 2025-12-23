"use client";
import { useEffect, useState } from "react";
import { usePostRequest } from "@/controller/postRequests";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = typeof window !== "undefined" ? window.atob(base64) : Buffer.from(base64, "base64").toString("binary");
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushOptIn({ className = "" }) {
  const [visible, setVisible] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState("");
  const { sendPostRequest } = usePostRequest();

  useEffect(() => {
    try {
      const hasNotif = typeof window !== "undefined" && "Notification" in window;
      const hasSW = typeof navigator !== "undefined" && "serviceWorker" in navigator;
      setSupported(hasNotif && hasSW);
      if (!(hasNotif && hasSW)) return;
      if (Notification.permission === "default") setVisible(true);
    } catch {}
  }, []);

  const subscribe = async () => {
    try {
      setError("");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setVisible(false);
        return;
      }

      const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublic) {
        setError("Push is not available (missing VAPID key)");
        setVisible(false);
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic),
      });

      await sendPostRequest("/push/subscribe", subscription.toJSON(), true);
      setVisible(false);
    } catch (e) {
      setError(e?.message || "Failed to enable push");
      setVisible(false);
    }
  };

  const dismiss = () => setVisible(false);

  if (!supported || !visible) return null;

  return (
    <div className={`w-full bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 ${className}`}>
      <div className="flex-1 text-sm text-slate-800">
        Get notified about flash sales and exclusive coupons.
        {error && <span className="ml-2 text-xs text-red-500">{error}</span>}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={subscribe} className="px-3 h-9 rounded-md bg-[#F24E2E] text-white text-sm">Enable</button>
        <button onClick={dismiss} className="px-3 h-9 rounded-md border border-gray-200 text-sm">Later</button>
      </div>
    </div>
  );
}
