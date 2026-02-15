'use client';

import { useState } from 'react';
import axios from 'axios';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function SubscriptionCard({ subscription, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(null);
  const { formatPrice } = useCurrency();

  const frequencyLabels = {
    weekly: 'Weekly Delivery',
    biweekly: 'Bi-weekly Delivery',
    monthly: 'Monthly Delivery',
    bimonthly: 'Bi-monthly Delivery',
    quarterly: 'Quarterly Delivery',
    custom: 'Custom Delivery',
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
  
  // Format date as DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Pad numbers with leading zero
  const padNumber = (num) => {
    return String(num).padStart(2, '0');
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 flex-shrink-0">
          <img 
            src={subscription.product?.image 
              ? `${process.env.NEXT_PUBLIC_API_URL}/${subscription.product.image}`
              : '/images/product-image-placeholder.png'
            } 
            alt={subscription.product?.name || 'Product'}
            className="w-full h-full object-cover rounded-full border border-gray-100"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/product-image-placeholder.png';
            }}
          />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-oxford-blue leading-tight mb-1">
            {subscription.product?.name || 'Product Subscription'}
          </h3>
          <p className="text-sm text-gray-500 font-normal">
            {frequencyLabels[subscription.frequency]}
          </p>
        </div>
      </div>

      {/* Details List */}
      <div className="space-y-3 mb-6">
        {/* Quantity */}
        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
          <span className="text-oxford-blue text-sm font-medium">Quantity :</span>
          <span className="text-gray-500 text-sm font-normal">
            {padNumber(subscription.quantity)}
          </span>
        </div>

        {/* Price */}
        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
          <span className="text-oxford-blue text-sm font-medium">Price :</span>
          <span className="text-gray-500 text-sm font-normal">
            {formatPrice(subscription.price)}
          </span>
        </div>

        {/* Next Delivery */}
        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
          <span className="text-oxford-blue text-sm font-medium">Next Delivery:</span>
          <span className="text-gray-500 text-sm font-normal">
            {formatDate(subscription.next_delivery_date)}
          </span>
        </div>

        {/* Total Delivery */}
        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
          <span className="text-oxford-blue text-sm font-medium">Total Delivery :</span>
          <span className="text-gray-500 text-sm font-normal">
            {padNumber(subscription.total_deliveries)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-auto">
        {subscription.status === 'active' || subscription.status === 'paused' ? (
          <>
            <button
               onClick={() => {
                 if (confirm('Are you sure you want to cancel this subscription?')) {
                   handleAction('cancel');
                 }
               }}
               disabled={loading}
               className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading && action === 'cancel' ? 'Cancelling...' : 'Cancel'}
            </button>
            
            {subscription.status === 'active' ? (
              <button
                onClick={() => handleAction('pause')}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-[#F44322] hover:bg-[#d63a1e] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading && action === 'pause' ? 'Pausing...' : 'Pause'}
              </button>
            ) : (
              <button
                onClick={() => handleAction('resume')}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-[#F44322] hover:bg-[#d63a1e] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading && action === 'resume' ? 'Resuming...' : 'Resume'}
              </button>
            )}
          </>
        ) : (
          <div className="w-full text-center py-2 px-4 bg-gray-50 text-gray-500 rounded-lg text-sm border border-gray-100">
            Subscription {subscription.status}
          </div>
        )}
      </div>
    </div>
  );
}
