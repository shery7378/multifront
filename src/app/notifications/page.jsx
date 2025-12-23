'use client';

import { useState, useEffect } from 'react';
import { useGetRequest } from '@/controller/getRequests';
import { usePostRequest } from '@/controller/postRequests';
import BackButton from '@/components/UI/BackButton';
import { useI18n } from '@/contexts/I18nContext';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState([]);
  const { data, loading, error, sendGetRequest } = useGetRequest();
  const { sendPostRequest } = usePostRequest();

  useEffect(() => {
    sendGetRequest('/notifications', true).then((response) => {
      if (response?.data) {
        setNotifications(response.data);
      } else if (response?.status === 200 && Array.isArray(response)) {
        // Handle case where response is directly an array
        setNotifications(response);
      }
    }).catch((err) => {
      console.error('Failed to load notifications:', err);
    });
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await sendPostRequest(`/notifications/${notificationId}/read`, {}, true);
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
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

  if (loading) {
    return (
      <div className="px-4 md:px-7 w-full sm:w-[95%] md:w-[90%] lg:w-[82%] xl:w-[83%] mx-auto py-8">
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-7 w-full sm:w-[95%] md:w-[90%] lg:w-[82%] xl:w-[83%] mx-auto py-8">
      <div className="flex gap-2 w-full items-center mb-8">
        <BackButton iconClasses="!text-black" />
        <span className="font-medium text-oxford-blue">Back</span>
      </div>

      <h1 className="text-2xl font-bold text-oxford-blue mb-6">Notifications</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Failed to load notifications
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 ${
                !notification.read
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-oxford-blue">
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-vivid-red rounded-full"></span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-2">{notification.description}</p>
                  {notification.data?.admin_question && (
                    <div className="bg-white border border-gray-200 rounded p-3 mt-2">
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        Admin Question:
                      </p>
                      <p className="text-sm text-gray-800">
                        {notification.data.admin_question}
                      </p>
                    </div>
                  )}
                  {notification.data?.refund_request_id && (
                    <Link
                      href={`/refund-requests`}
                      className="text-vivid-red text-sm font-medium hover:underline mt-2 inline-block"
                    >
                      View Refund Request →
                    </Link>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {formatTime(notification.time)}
                  </p>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="ml-4 p-2 hover:bg-gray-100 rounded-full"
                    title="Mark as read"
                  >
                    <CheckIcon className="w-5 h-5 text-gray-600" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

