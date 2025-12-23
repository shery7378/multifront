'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/store/slices/authSlice';

export default function SessionTimeout({ timeoutMinutes = 120, warningMinutes = 5 }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    if (!isAuthenticated) return;

    // Update last activity on user interaction
    const updateActivity = () => {
      setLastActivity(Date.now());
      setShowWarning(false);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // Check timeout interval
    const interval = setInterval(() => {
      const now = Date.now();
      const inactiveTime = (now - lastActivity) / 1000 / 60; // minutes
      const remaining = timeoutMinutes - inactiveTime;
      const warningTime = warningMinutes;

      if (remaining <= 0) {
        // Session expired - logout
        dispatch(logout());
        router.push('/login?expired=true');
        clearInterval(interval);
      } else if (remaining <= warningTime) {
        // Show warning
        setTimeRemaining(Math.ceil(remaining));
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }, 1000); // Check every second

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [isAuthenticated, lastActivity, timeoutMinutes, warningMinutes, dispatch, router]);

  const handleExtend = () => {
    setLastActivity(Date.now());
    setShowWarning(false);
  };

  if (!showWarning || !isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold text-oxford-blue mb-2">
          Session Expiring Soon
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Your session will expire in {timeRemaining} minute{timeRemaining !== 1 ? 's' : ''}. 
          Click "Stay Logged In" to continue.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExtend}
            className="flex-1 bg-vivid-red text-white py-2 px-4 rounded-md hover:bg-red-700"
          >
            Stay Logged In
          </button>
          <button
            onClick={() => {
              dispatch(logout());
              router.push('/login');
            }}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

