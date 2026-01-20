'use client';

import { useState, useEffect } from 'react';
import { useGetRequest } from '@/controller/getRequests';
import SubscriptionCard from './SubscriptionCard';
import Button from '@/components/UI/Button';

export default function SubscriptionsList({ status = null }) {
  const { data, loading, sendGetRequest } = useGetRequest();
  const [subscriptions, setSubscriptions] = useState([]);
  const [filter, setFilter] = useState(status || 'all');

  // Fetch subscriptions when filter changes or on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const url = filter !== 'all' ? `/subscriptions?status=${filter}` : '/subscriptions';
      console.log('SubscriptionsList - Fetching subscriptions:', url);
      sendGetRequest(url, true);
    } else {
      console.warn('SubscriptionsList - No auth token found');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    console.log('SubscriptionsList - Data received:', data);
    if (data?.data) {
      const subs = Array.isArray(data.data) ? data.data : [];
      console.log('SubscriptionsList - Setting subscriptions:', subs);
      setSubscriptions(subs);
    } else if (data && !data.data) {
      // Handle case where data might be directly an array or empty response
      console.log('SubscriptionsList - No data.data found, data:', data);
      setSubscriptions([]);
    }
  }, [data]);

  const handleUpdate = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const url = filter !== 'all' ? `/subscriptions?status=${filter}` : '/subscriptions';
      sendGetRequest(url, true);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex gap-2 mb-4">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            onClick={() => setFilter('all')}
            className="text-sm"
          >
            All
          </Button>
          <Button
            variant={filter === 'active' ? 'primary' : 'outline'}
            onClick={() => setFilter('active')}
            className="text-sm"
          >
            Active
          </Button>
          <Button
            variant={filter === 'paused' ? 'primary' : 'outline'}
            onClick={() => setFilter('paused')}
            className="text-sm"
          >
            Paused
          </Button>
          <Button
            variant={filter === 'cancelled' ? 'primary' : 'outline'}
            onClick={() => setFilter('cancelled')}
            className="text-sm"
          >
            Cancelled
          </Button>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-2 border-[#F44422] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          onClick={() => setFilter('all')}
          className="text-sm"
        >
          All
        </Button>
        <Button
          variant={filter === 'active' ? 'primary' : 'outline'}
          onClick={() => setFilter('active')}
          className="text-sm"
        >
          Active
        </Button>
        <Button
          variant={filter === 'paused' ? 'primary' : 'outline'}
          onClick={() => setFilter('paused')}
          className="text-sm"
        >
          Paused
        </Button>
        <Button
          variant={filter === 'cancelled' ? 'primary' : 'outline'}
          onClick={() => setFilter('cancelled')}
          className="text-sm"
        >
          Cancelled
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No subscriptions</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You don't have any {filter !== 'all' ? filter : ''} subscriptions yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

