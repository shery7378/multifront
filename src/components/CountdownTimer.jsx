'use client';

import { useState, useEffect } from 'react';

export default function CountdownTimer({ endDate, onComplete, className = '' }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (onComplete) {
          onComplete();
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endDate, onComplete]);

  if (isExpired) {
    return (
      <div className={`text-red-600 font-semibold ${className}`}>
        Expired
      </div>
    );
  }

  const formatTime = (value) => String(value).padStart(2, '0');

  return (
    <div className={`flex items-center gap-2 ${className}`} role="timer" aria-live="polite" aria-label={`Time remaining: ${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds`}>
      {timeLeft.days > 0 && (
        <>
          <div className="flex flex-col items-center bg-red-600 text-white px-3 py-2 rounded-lg min-w-[60px]">
            <span className="text-2xl font-bold">{formatTime(timeLeft.days)}</span>
            <span className="text-xs uppercase">Days</span>
          </div>
          <span className="text-red-600 font-bold">:</span>
        </>
      )}
      <div className="flex flex-col items-center bg-red-600 text-white px-3 py-2 rounded-lg min-w-[60px]">
        <span className="text-2xl font-bold">{formatTime(timeLeft.hours)}</span>
        <span className="text-xs uppercase">Hours</span>
      </div>
      <span className="text-red-600 font-bold">:</span>
      <div className="flex flex-col items-center bg-red-600 text-white px-3 py-2 rounded-lg min-w-[60px]">
        <span className="text-2xl font-bold">{formatTime(timeLeft.minutes)}</span>
        <span className="text-xs uppercase">Mins</span>
      </div>
      <span className="text-red-600 font-bold">:</span>
      <div className="flex flex-col items-center bg-red-600 text-white px-3 py-2 rounded-lg min-w-[60px]">
        <span className="text-2xl font-bold">{formatTime(timeLeft.seconds)}</span>
        <span className="text-xs uppercase">Secs</span>
      </div>
    </div>
  );
}

