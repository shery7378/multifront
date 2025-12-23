'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import LiveSellingCard from './LiveSellingCard';
import { useI18n } from '@/contexts/I18nContext';

export default function LiveSellingList({ liveOnly = false, upcoming = false }) {
  const { t } = useI18n();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, [liveOnly, upcoming]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (liveOnly) params.append('live_only', 'true');
      if (upcoming) params.append('upcoming', 'true');

      const response = await axios.get(`/api/live-selling?${params.toString()}`);
      setSessions(response.data.data?.data || response.data.data || []);
    } catch (err) {
      console.error('Error fetching live selling sessions:', err);
      setError(err.response?.data?.message || 'Failed to load live sessions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>{error}</p>
        <button
          onClick={fetchSessions}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No live selling sessions available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sessions.map((session, index) => (
        <LiveSellingCard key={session.id} session={session} index={index} />
      ))}
    </div>
  );
}

