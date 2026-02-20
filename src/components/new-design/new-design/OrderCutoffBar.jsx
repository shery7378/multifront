'use client';

import { useEffect, useMemo, useState } from 'react';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatHMS(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

export default function OrderCutoffBar({
  cutoffHour = 19,
  cutoffMinute = 0,
  cutoffLabel = '7:00 PM',
  deliveryDayLabel = 'today',
  className = '',
}) {
  const [timeLeft, setTimeLeft] = useState('00:00:00');

  const target = useMemo(() => {
    const d = new Date();
    d.setHours(cutoffHour, cutoffMinute, 0, 0);
    return d;
  }, [cutoffHour, cutoffMinute]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setTimeLeft(formatHMS(target.getTime() - now));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className={`w-full bg-white  ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex items-center justify-center border-b border-[#EAEAEA] py-[7px]">
        <p className="text-center text-[13px] sm:text-sm md:texlg font-semibold text-[#F44322] leading-6" role="timer" aria-live="polite">
          Order by {cutoffLabel} 
            for delivery 
           {deliveryDayLabel}  —  {timeLeft} left 
        </p>
        </div>
      </div>
    </div>
  );
}

