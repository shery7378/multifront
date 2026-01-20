'use client';

import { useState, useEffect, useRef } from 'react';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useGetRequest } from '@/controller/getRequests';
import { usePostRequest } from '@/controller/postRequests';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isDark } = useTheme();
  const { data, sendGetRequest, loading } = useGetRequest();
  const { sendPostRequest } = usePostRequest();
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    // Fetch notifications when dropdown opens
    if (isDropdownOpen) {
      sendGetRequest('/notifications', true).then((response) => {
        if (response?.data) {
          setNotifications(response.data);
        } else if (response?.status === 200 && Array.isArray(response)) {
          setNotifications(response);
        }
      }).catch((err) => {
        console.error('Failed to load notifications:', err);
      });
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const markAsRead = async (notificationId) => {
    try {
      await sendPostRequest(`/notifications/${notificationId}/read`, {}, true);
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const formatTime = (timeString) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`relative w-12 h-12 rounded-full border flex items-center justify-center hover:border-vivid-red hover:shadow-[0_0_10px_#ef4444] transition cursor-pointer ${
          isDark 
            ? 'border-slate-700 bg-slate-800' 
            : 'border-gray-200 bg-white'
        }`}
      >
        <BellIcon className={`w-6 h-6 ${isDark ? 'text-gray-200' : 'text-black'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-vivid-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isDropdownOpen && (
        <div className={`absolute right-0 mt-2 w-96 max-h-[600px] overflow-y-auto rounded-lg shadow-lg border z-50 ${
          isDark 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className={`p-4 border-b ${
            isDark ? 'border-slate-700' : 'border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-200' : 'text-oxford-blue'}`}>
              Notifications
            </h3>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                      !notification.read
                        ? isDark 
                          ? 'bg-slate-700/50' 
                          : 'bg-blue-50'
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-oxford-blue'}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-vivid-red rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <p className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {notification.description}
                        </p>
                        {notification.data?.admin_question && (
                          <div className={`border rounded p-2 mt-2 ${
                            isDark 
                              ? 'bg-slate-900 border-slate-600' 
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <p className={`text-xs font-medium mb-1 ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              Admin Question:
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                              {notification.data.admin_question}
                            </p>
                          </div>
                        )}
                        {notification.data?.refund_request_id && (
                          <Link
                            href={`/refund-requests`}
                            className="text-vivid-red text-xs font-medium hover:underline mt-2 inline-block"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            View Refund Request →
                          </Link>
                        )}
                        <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {formatTime(notification.time)}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className={`p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 flex-shrink-0 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}
                          title="Mark as read"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

