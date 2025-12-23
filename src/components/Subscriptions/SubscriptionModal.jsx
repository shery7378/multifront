'use client';

import { useState } from 'react';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import axios from 'axios';

export default function SubscriptionModal({ isOpen, onClose, orderId, productId, onSuccess }) {
  const [frequency, setFrequency] = useState('monthly');
  const [frequencyDays, setFrequencyDays] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [remainingDeliveries, setRemainingDeliveries] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const frequencies = [
    { value: 'weekly', label: 'Weekly', days: 7 },
    { value: 'biweekly', label: 'Bi-weekly', days: 14 },
    { value: 'monthly', label: 'Monthly', days: 30 },
    { value: 'bimonthly', label: 'Bi-monthly', days: 60 },
    { value: 'quarterly', label: 'Quarterly', days: 90 },
    { value: 'custom', label: 'Custom', days: null },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const payload = {
        order_id: orderId,
        frequency,
        quantity,
        ...(frequency === 'custom' && frequencyDays ? { frequency_days: parseInt(frequencyDays) } : {}),
        ...(remainingDeliveries ? { remaining_deliveries: parseInt(remainingDeliveries) } : {}),
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/subscriptions`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status === 201) {
        if (onSuccess) {
          onSuccess(response.data.data);
        }
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Subscription"
      className="max-w-md"
      showCloseButton={true}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F44422] focus:border-transparent"
          >
            {frequencies.map((freq) => (
              <option key={freq.value} value={freq.value}>
                {freq.label}
              </option>
            ))}
          </select>
        </div>

        {frequency === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days Between Deliveries
            </label>
            <Input
              type="number"
              value={frequencyDays}
              onChange={(e) => setFrequencyDays(e.target.value)}
              placeholder="e.g., 45"
              min="1"
              required={frequency === 'custom'}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity per Delivery
          </label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Deliveries (Leave empty for unlimited)
          </label>
          <Input
            type="number"
            value={remainingDeliveries}
            onChange={(e) => setRemainingDeliveries(e.target.value)}
            placeholder="e.g., 12 (or leave empty for unlimited)"
            min="1"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Subscription'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

