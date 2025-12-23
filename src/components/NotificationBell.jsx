'use client';

import { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useGetRequest } from '@/controller/getRequests';
import Link from 'next/link';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { data, sendGetRequest, loading } = useGetRequest();

  useEffect(() => {
    // Fetch unread count
    sendGetRequest('/notifications/unread-count', true).then((response) => {
      if (response?.count !== undefined) {
        setUnreadCount(response.count);
      } else if (typeof response === 'number') {
        setUnreadCount(response);
      }
    }).catch((err) => {
      console.error('Failed to load unread count:', err);
      setUnreadCount(0);
    });
  }, []);

  return (
    <Link href="/notifications" className="relative">
      <span className="relative w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:border-vivid-red hover:shadow-[0_0_10px_#ef4444] transition cursor-pointer">
        <BellIcon className="w-6 h-6 text-black" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-vivid-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </span>
    </Link>
  );
}

