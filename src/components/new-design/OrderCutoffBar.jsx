'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGetRequest } from '@/controller/getRequests';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatHMS(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function formatTime12h(date) {
  let h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${pad2(m)} ${ampm}`;
}

export default function OrderCutoffBar({ className = '' }) {
  const [timeLeft, setTimeLeft] = useState('00:00:00');
  const { data: flashData, sendGetRequest: getFlash } = useGetRequest();
  const [flashSale, setFlashSale] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getFlash('/flash-sales/active');
  }, [getFlash]);

  useEffect(() => {
    if (flashData === undefined) return;
    const sales =
      (Array.isArray(flashData) && flashData) ||
      (Array.isArray(flashData?.data) && flashData.data) ||
      (Array.isArray(flashData?.data?.flash_sales) && flashData.data.flash_sales) ||
      null;
    setFlashSale(sales && sales.length > 0 ? sales[0] : null);
    setLoaded(true);
  }, [flashData]);

  const endDate = flashSale
    ? flashSale.end_date || flashSale.ends_at || flashSale.end_time || null
    : null;

  const target = useMemo(() => {
    if (endDate) return new Date(endDate);
    return null;
  }, [endDate]);

  useEffect(() => {
    if (!target) return;
    const tick = () => setTimeLeft(formatHMS(target.getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  // Hide entirely if not loaded yet or no active flash sale
  if (!loaded || !flashSale) return null;

  const saleName = flashSale.title || flashSale.name || 'Flash Sale';
  const endDateObj = endDate ? new Date(endDate) : null;
  const isToday = endDateObj && endDateObj.toDateString() === new Date().toDateString();
  const dayLabel = endDateObj
    ? isToday ? 'today' : endDateObj.toLocaleDateString(undefined, { weekday: 'long' })
    : '';

  return (
    <div className={`w-full bg-white ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-center border-b border-[#EAEAEA] py-[7px]">
          <p
            className="text-center text-[13px] sm:text-sm font-semibold text-[#F44322] leading-6"
            role="timer"
            aria-live="polite"
          >
            {endDateObj ? (
              <>
                ⚡ <strong>{saleName}</strong> — Order now before{' '}
                <strong>{formatTime12h(endDateObj)}</strong> {dayLabel} —{' '}
                <strong>{timeLeft}</strong> left
              </>
            ) : (
              <>⚡ <strong>{saleName}</strong> — Flash Sale is live now!</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
