'use client';

import { useState } from 'react';
import Button from '@/components/UI/Button';
import axios from 'axios';

export default function SubscriptionCard({ subscription, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(null);

  const frequencyLabels = {
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    bimonthly: 'Bi-monthly',
    quarterly: 'Quarterly',
    custom: 'Custom',
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
  };

  const handleAction = async (actionType) => {
    setLoading(true);
    setAction(actionType);

    try {
      const token = localStorage.getItem('auth_token');
      const endpoint = actionType === 'cancel' 
        ? `/api/subscriptions/${subscription.id}/cancel`
        : `/api/subscriptions/${subscription.id}/${actionType}`;

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        actionType === 'cancel' ? { reason: 'User requested cancellation' } : {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 200) {
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${actionType} subscription`);
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
            {subscription.product?.name || 'Product'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {frequencyLabels[subscription.frequency]} delivery
          </p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[subscription.status] || statusColors.active}`}>
          {subscription.status}
        </span>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{subscription.quantity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Price:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            ${parseFloat(subscription.price).toFixed(2)} per delivery
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Next Delivery:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {new Date(subscription.next_delivery_date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Total Deliveries:</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {subscription.total_deliveries}
            {subscription.remaining_deliveries !== null && ` / ${subscription.total_deliveries + subscription.remaining_deliveries}`}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {subscription.status === 'active' && (
          <>
            <Button
              variant="outline"
              onClick={() => handleAction('pause')}
              disabled={loading && action === 'pause'}
              className="flex-1 text-sm"
            >
              {loading && action === 'pause' ? 'Pausing...' : 'Pause'}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm('Are you sure you want to cancel this subscription?')) {
                  handleAction('cancel');
                }
              }}
              disabled={loading && action === 'cancel'}
              className="flex-1 text-sm"
            >
              {loading && action === 'cancel' ? 'Cancelling...' : 'Cancel'}
            </Button>
          </>
        )}
        {subscription.status === 'paused' && (
          <Button
            variant="primary"
            onClick={() => handleAction('resume')}
            disabled={loading && action === 'resume'}
            className="flex-1 text-sm"
          >
            {loading && action === 'resume' ? 'Resuming...' : 'Resume'}
          </Button>
        )}
      </div>
    </div>
  );
}

