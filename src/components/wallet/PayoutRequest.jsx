'use client';

import { useState } from 'react';
import { usePostRequest } from '@/controller/postRequests';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function PayoutRequest({ availableBalance, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const { loading, error, sendPostRequest } = usePostRequest();
  const [success, setSuccess] = useState(false);

  const minPayout = 10.00;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payoutAmount = parseFloat(amount);
    
    if (isNaN(payoutAmount) || payoutAmount < minPayout) {
      return;
    }

    if (payoutAmount > availableBalance) {
      return;
    }

    try {
      await sendPostRequest('/wallet/payout', { amount: payoutAmount }, true);
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      console.error('Error requesting payout:', err);
    }
  };

  const setQuickAmount = (percentage) => {
    const quickAmount = (availableBalance * percentage).toFixed(2);
    setAmount(parseFloat(quickAmount));
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Payout Request Successful!</h3>
            <p className="text-sm text-gray-500">Your payout request has been processed successfully.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Request Payout</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payout Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                min={minPayout}
                max={availableBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Available: ${parseFloat(availableBalance).toFixed(2)} | Minimum: ${minPayout.toFixed(2)}
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setQuickAmount(0.25)}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => setQuickAmount(0.5)}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setQuickAmount(0.75)}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              75%
            </button>
            <button
              type="button"
              onClick={() => setAmount(availableBalance.toFixed(2))}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              All
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {parseFloat(amount) < minPayout && amount && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Minimum payout amount is ${minPayout.toFixed(2)}
              </p>
            </div>
          )}

          {parseFloat(amount) > availableBalance && amount && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                Amount exceeds available balance
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !amount ||
                parseFloat(amount) < minPayout ||
                parseFloat(amount) > availableBalance
              }
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Request Payout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

