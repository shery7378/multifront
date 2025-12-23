'use client';

import { useState, useEffect } from 'react';
import { useGetRequest } from '@/controller/getRequests';

export default function LoyaltyPointsDisplay() {
  const { data, loading, sendGetRequest } = useGetRequest();
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      sendGetRequest('/loyalty-points', true);
    }
  }, []);

  useEffect(() => {
    if (data?.data?.balance !== undefined) {
      setPoints(data.data.balance);
    }
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="w-4 h-4 border-2 border-[#F44422] border-t-transparent rounded-full animate-spin"></div>
        <span>Loading points...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span className="font-semibold text-gray-700">{points.toLocaleString()}</span>
      <span className="text-sm text-gray-500">Points</span>
    </div>
  );
}

