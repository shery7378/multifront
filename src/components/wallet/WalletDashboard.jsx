'use client';

import { useState, useEffect } from 'react';
import StripeOnboarding from './StripeOnboarding';
import PayoutRequest from './PayoutRequest';
import TransactionHistory from './TransactionHistory';
import WalletStatistics from './WalletStatistics';
import { useGetRequest } from '@/controller/getRequests';
import { WalletIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

export default function WalletDashboard({ walletData, onRefresh }) {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const { data: statisticsData, sendGetRequest: fetchStatistics } = useGetRequest();

  useEffect(() => {
    fetchStatistics('/wallet/statistics', true);
  }, []);

  if (!walletData) {
    return null;
  }

  const { wallet, available_balance, recent_transactions, stripe_account, is_stripe_connected } = walletData;
  const statistics = statisticsData;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wallet & Payouts</h1>
          <p className="mt-2 text-gray-600">Manage your earnings and request payouts</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Available Balance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <WalletIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${parseFloat(available_balance || wallet?.balance || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Total Earned */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <ArrowUpTrayIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earned</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${parseFloat(wallet?.total_earned || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Total Paid Out */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <ArrowDownTrayIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Paid Out</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${parseFloat(wallet?.total_paid_out || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Balance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <WalletIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${parseFloat(wallet?.pending_balance || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stripe Connect Status */}
        {!is_stripe_connected && (
          <div className="mb-8">
            <StripeOnboarding 
              stripeAccount={stripe_account} 
              onConnected={onRefresh}
            />
          </div>
        )}

        {/* Statistics */}
        {statistics && (
          <div className="mb-8">
            <WalletStatistics statistics={statistics} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8 flex gap-4">
          {is_stripe_connected && parseFloat(available_balance || 0) > 0 && (
            <button
              onClick={() => setShowPayoutModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Request Payout
            </button>
          )}
          <button
            onClick={onRefresh}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Refresh
          </button>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
          </div>
          <TransactionHistory 
            initialTransactions={recent_transactions}
            walletId={wallet?.id}
          />
        </div>

        {/* Payout Modal */}
        {showPayoutModal && (
          <PayoutRequest
            availableBalance={available_balance || wallet?.balance || 0}
            onClose={() => setShowPayoutModal(false)}
            onSuccess={() => {
              setShowPayoutModal(false);
              onRefresh();
              fetchStatistics('/wallet/statistics', true);
            }}
          />
        )}
      </div>
    </div>
  );
}

