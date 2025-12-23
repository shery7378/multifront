'use client';

import { useState, useEffect } from 'react';
import { useGetRequest } from '@/controller/getRequests';
import SubscriptionCard from './SubscriptionCard';
import Button from '@/components/UI/Button';

export default function SubscriptionsList({ status = null }) {
  const { data, loading, sendGetRequest } = useGetRequest();
  const [subscriptions, setSubscriptions] = useState([]);
  const [filter, setFilter] = useState(status || 'all');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const url = filter !== 'all' ? `/subscriptions?status=${filter}` : '/subscriptions';
      sendGetRequest(url, true);
    }
  }, [filter]);

  useEffect(() => {
    if (data?.data) {
      setSubscriptions(Array.isArray(data.data) ? data.data : []);
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
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-2 border-[#F44422] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No subscriptions</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You don't have any active subscriptions yet.
        </p>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {subscriptions.map((subscription) => (
          <SubscriptionCard
            key={subscription.id}
            subscription={subscription}
            onUpdate={handleUpdate}
          />
        ))}
      </div>
    </div>
  );
}

