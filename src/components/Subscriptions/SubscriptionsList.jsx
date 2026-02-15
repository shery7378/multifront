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
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-oxford-blue px-6">
          <div className="w-full max-w-[320px] flex flex-col items-center text-center">
            {/* Illustration */}
            <div className="relative w-full max-w-[280px] mb-6">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/storage/images/no-orders-yet.png`}
                alt="No subscriptions illustration"
                className="w-full h-auto object-contain mx-auto"
              />
            </div>

            {/* Text Content */}
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl text-oxford-blue font-bold mb-3">
                No subscriptions
              </h2>
              <p className="text-sm text-gray-500 max-w-[260px] mx-auto leading-relaxed">
                You don't have any {filter !== 'all' ? filter : ''} subscriptions yet.
              </p>
            </div>
          </div>
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

