'use client';

import { useState } from 'react';
import LiveSellingList from '@/components/LiveSelling/LiveSellingList';
import SharedLayout from '@/components/SharedLayout';
import { useI18n } from '@/contexts/I18nContext';

export default function LiveSellingPage() {
  const { t } = useI18n();
  const [filter, setFilter] = useState('all'); // all, live, upcoming

  return (
    <SharedLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Live Selling</h1>
          <p className="text-gray-600">Watch live product demonstrations and shop in real-time</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setFilter('all')}
            className={`pb-2 px-4 ${
              filter === 'all'
                ? 'border-b-2 border-blue-500 text-blue-500 font-semibold'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            All Sessions
          </button>
          <button
            onClick={() => setFilter('live')}
            className={`pb-2 px-4 ${
              filter === 'live'
                ? 'border-b-2 border-red-500 text-red-500 font-semibold'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Live Now
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`pb-2 px-4 ${
              filter === 'upcoming'
                ? 'border-b-2 border-blue-500 text-blue-500 font-semibold'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Upcoming
          </button>
        </div>

        {/* Sessions List */}
        <LiveSellingList
          liveOnly={filter === 'live'}
          upcoming={filter === 'upcoming'}
        />
      </div>
    </SharedLayout>
  );
}

