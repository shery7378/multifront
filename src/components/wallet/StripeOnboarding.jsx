'use client';

import { useState, useEffect } from 'react';
import { usePostRequest } from '@/controller/postRequests';
import { useGetRequest } from '@/controller/getRequests';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function StripeOnboarding({ stripeAccount, onConnected }) {
  const { loading: postLoading, error: postError, sendPostRequest } = usePostRequest();
  const { data: accountData, loading: getLoading, error: getError, sendGetRequest } = useGetRequest();
  const [onboardingUrl, setOnboardingUrl] = useState(stripeAccount?.onboarding_link || null);
  const [accountStatus, setAccountStatus] = useState(stripeAccount?.status || null);
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(!stripeAccount);

  const loading = postLoading || getLoading;
  const error = postError || getError;

  useEffect(() => {
    if (accountData) {
      setAccountStatus(accountData.account?.status || accountData.status);
      if (accountData.is_connected) {
        onConnected?.();
      }
      if (accountData.onboarding_url) {
        setOnboardingUrl(accountData.onboarding_url);
      }
    }
  }, [accountData, onConnected]);

  const handleCreateAccount = async () => {
    if (!email.trim()) {
      return;
    }

    try {
      const response = await sendPostRequest('/stripe-connect/create-account', { email: email.trim() }, true);
      if (response.onboarding_url) {
        setOnboardingUrl(response.onboarding_url);
        setShowEmailInput(false);
      } else if (response.is_connected) {
        onConnected?.();
        setShowEmailInput(false);
      }
    } catch (err) {
      console.error('Error creating Stripe account:', err);
      // Error will be shown via the error state from usePostRequest
    }
  };

  const handleCheckStatus = async () => {
    try {
      await sendGetRequest('/stripe-connect/account', true);
    } catch (err) {
      console.error('Error checking status:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'incomplete':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
      case 'restricted':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'rejected':
      case 'restricted':
        return <XCircleIcon className="h-5 w-5" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Connect Stripe Account
          </h3>
          <p className="text-sm text-gray-600">
            Connect your Stripe account to receive payouts. You'll be redirected to Stripe to complete the setup.
          </p>
        </div>
        {accountStatus && (
          <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(accountStatus)}`}>
            {getStatusIcon(accountStatus)}
            {accountStatus.charAt(0).toUpperCase() + accountStatus.slice(1)}
          </span>
        )}
      </div>

      {onboardingUrl ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-4">
              Click the button below to complete your Stripe Connect onboarding. You'll be redirected to Stripe's secure platform.
            </p>
            <a
              href={onboardingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Complete Stripe Onboarding
            </a>
          </div>
          <button
            onClick={handleCheckStatus}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            I've completed onboarding - Check status
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          {showEmailInput && (
            <div className="space-y-3">
              <div>
                <label htmlFor="stripe-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your Stripe account email
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Enter the email address associated with your Stripe account. If you don't have one, we'll help you create it.
                </p>
                <input
                  id="stripe-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleCreateAccount}
                disabled={loading || !email.trim()}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Connect Stripe Account'}
              </button>
            </div>
          )}
          
          {!showEmailInput && !onboardingUrl && (
            <button
              onClick={() => setShowEmailInput(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Connect Stripe Account
            </button>
          )}
        </div>
      )}
    </div>
  );
}

