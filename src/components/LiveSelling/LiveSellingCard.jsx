'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlay, FaUsers, FaClock } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useI18n } from '@/contexts/I18nContext';

export default function LiveSellingCard({ session, index = 0 }) {
  const { t } = useI18n();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const isLive = session.status === 'live';
  const isScheduled = session.status === 'scheduled';
  const isEnded = session.status === 'ended';

  const handleClick = () => {
    if (isLive || isScheduled) {
      router.push(`/live-selling/${session.id}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative">
        {/* Thumbnail */}
        <div className="relative h-48 bg-gray-200 overflow-hidden">
          {session.thumbnail && !imageError ? (
            <img
              src={session.thumbnail}
              alt={session.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
              <FaPlay className="text-white text-4xl" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-2 left-2">
            {isLive && (
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                LIVE
              </span>
            )}
            {isScheduled && (
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <FaClock className="text-xs" />
                Scheduled
              </span>
            )}
            {isEnded && (
              <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Ended
              </span>
            )}
          </div>

          {/* Viewer Count */}
          {isLive && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <FaUsers className="text-xs" />
              {session.viewer_count || 0}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 line-clamp-2">{session.title}</h3>
          
          {session.description && (
            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{session.description}</p>
          )}

          {/* Vendor Info */}
          {session.vendor && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-xs font-semibold">
                  {session.vendor.first_name?.[0] || session.vendor.email?.[0] || 'V'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {session.vendor.first_name && session.vendor.last_name
                    ? `${session.vendor.first_name} ${session.vendor.last_name}`
                    : session.vendor.email}
                </p>
                {session.store && (
                  <p className="text-xs text-gray-500">{session.store.name}</p>
                )}
              </div>
            </div>
          )}

          {/* Scheduled Time */}
          {isScheduled && session.scheduled_at && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <FaClock className="text-xs" />
              Starts {formatDate(session.scheduled_at)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

