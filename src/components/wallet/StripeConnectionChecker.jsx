'use client';

import { useState, useEffect } from 'react';
import { useGetRequest } from '@/controller/getRequests';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Component to check and display Stripe connection status
 * Can be used anywhere in the app to verify if user's Stripe account is connected
 */
export default function StripeConnectionChecker({ showDetails = true }) {
  const { data, error, loading, sendGetRequest } = useGetRequest();
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    // Check wallet data which includes Stripe connection status
    sendGetRequest('/wallet', true);
  }, []);

  useEffect(() => {
    if (data) {
      const isConnected = data.is_stripe_connected || false;
      const stripeAccount = data.stripe_account || null;
      
      setConnectionStatus({
        isConnected,
        stripeAccount,
        accountStatus: stripeAccount?.status || 'not_created',
        chargesEnabled: stripeAccount?.charges_enabled || false,
        payoutsEnabled: stripeAccount?.payouts_enabled || false,
      });
    }
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        <span>Checking Stripe connection...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <XCircleIcon className="h-5 w-5" />
        <span>Error checking Stripe status: {error}</span>
      </div>
    );
  }

  if (!connectionStatus) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <ExclamationTriangleIcon className="h-5 w-5" />
        <span>No connection data available</span>
      </div>
    );
  }

  const { isConnected, accountStatus, chargesEnabled, payoutsEnabled, stripeAccount } = connectionStatus;

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">Stripe Connection Status</h3>
        {isConnected ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="font-medium">Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-600">
            <XCircleIcon className="h-5 w-5" />
            <span className="font-medium">Not Connected</span>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Account Status:</span>
            <span className={`font-medium ${
              accountStatus === 'active' ? 'text-green-600' :
              accountStatus === 'pending' || accountStatus === 'incomplete' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {accountStatus.charAt(0).toUpperCase() + accountStatus.slice(1)}
            </span>
          </div>
          
          {stripeAccount && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600">Charges Enabled:</span>
                <span className={`font-medium ${chargesEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {chargesEnabled ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Payouts Enabled:</span>
                <span className={`font-medium ${payoutsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {payoutsEnabled ? 'Yes' : 'No'}
                </span>
              </div>

              {stripeAccount.account_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Account ID:</span>
                  <span className="font-mono text-xs text-gray-500">{stripeAccount.account_id}</span>
                </div>
              )}
            </>
          )}

          {!isConnected && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                Your Stripe account is not connected. Please visit the Wallet page to connect your account.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

