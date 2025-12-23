'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import LiveSellingViewer from '@/components/LiveSelling/LiveSellingViewer';
import LiveSellingHost from '@/components/LiveSelling/LiveSellingHost';
import SharedLayout from '@/components/SharedLayout';
import { useI18n } from '@/contexts/I18nContext';
import { useSelector } from 'react-redux';

export default function LiveSellingSessionPage() {
  const { t } = useI18n();
  const params = useParams();
  const router = useRouter();
  const user = useSelector((state) => state.auth?.user);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSession();
  }, [params.id]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/live-selling/${params.id}`);
      setSession(response.data.data);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError(err.response?.data?.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    try {
      await axios.post(`/api/live-selling/${params.id}/end`);
      router.push('/live-selling');
    } catch (err) {
      console.error('Error ending session:', err);
    }
  };

  const handleClose = () => {
    router.push('/live-selling');
  };

  if (loading) {
    return (
      <SharedLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </SharedLayout>
    );
  }

  if (error || !session) {
    return (
      <SharedLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error || 'Session not found'}</p>
            <button
              onClick={() => router.push('/live-selling')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Back to Live Selling
            </button>
          </div>
        </div>
      </SharedLayout>
    );
  }

  // Check if user is the host
  const isHost = user && session.vendor_id === user.id;

  // If session is not live and user is not the host, show message
  if (session.status !== 'live' && !isHost) {
    return (
      <SharedLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              {session.status === 'scheduled'
                ? 'This session has not started yet.'
                : 'This session has ended.'}
            </p>
            <button
              onClick={() => router.push('/live-selling')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Back to Live Selling
            </button>
          </div>
        </div>
      </SharedLayout>
    );
  }

  return (
    <>
      {isHost ? (
        <LiveSellingHost session={session} onEnd={handleEndSession} />
      ) : (
        <LiveSellingViewer session={session} onClose={handleClose} />
      )}
    </>
  );
}

