'use client';

import { useState } from 'react';
import Button from '@/components/UI/Button';
import SubscriptionModal from './SubscriptionModal';
import { useSelector } from 'react-redux';

export default function SubscriptionButton({ product, orderId, className = '' }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Check if product supports subscriptions
  const subscriptionEnabled = product?.subscription_enabled || false;

  if (!subscriptionEnabled || !isAuthenticated) {
    return null;
  }

  const handleSuccess = (subscription) => {
    // Show success message or redirect
    alert(`Subscription created! Next delivery: ${subscription.next_delivery_date}`);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsModalOpen(true)}
        className={className}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Subscribe
      </Button>

      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderId={orderId}
        productId={product?.id}
        onSuccess={handleSuccess}
      />
    </>
  );
}

