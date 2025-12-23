'use client';

import StripeConnectionChecker from '@/components/wallet/StripeConnectionChecker';

/**
 * Test page to check Stripe connection status
 * Visit: /test-stripe-connection
 */
export default function TestStripeConnectionPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stripe Connection Status Check</h1>
          <p className="text-gray-600">This page displays the current Stripe connection status for your account.</p>
        </div>
        
        <StripeConnectionChecker showDetails={true} />
        
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How to Connect Stripe:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Go to the Wallet page (/vendor/wallet)</li>
            <li>Click "Connect Stripe Account" button</li>
            <li>Complete the Stripe onboarding process</li>
            <li>Return to this page to verify the connection</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

