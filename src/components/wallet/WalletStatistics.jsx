'use client';

export default function WalletStatistics({ statistics }) {
  if (!statistics) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Statistics</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Today's Earnings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Today's Earnings</p>
          <p className="text-2xl font-bold text-gray-900">
            ${parseFloat(statistics.today_earnings || 0).toFixed(2)}
          </p>
        </div>

        {/* This Month's Earnings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">This Month's Earnings</p>
          <p className="text-2xl font-bold text-gray-900">
            ${parseFloat(statistics.month_earnings || 0).toFixed(2)}
          </p>
        </div>

        {/* Last Month's Earnings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Last Month's Earnings</p>
          <p className="text-2xl font-bold text-gray-900">
            ${parseFloat(statistics.last_month_earnings || 0).toFixed(2)}
          </p>
        </div>

        {/* This Month's Payouts */}
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">This Month's Payouts</p>
          <p className="text-2xl font-bold text-gray-900">
            ${parseFloat(statistics.month_payouts || 0).toFixed(2)}
          </p>
        </div>

        {/* Total Transactions */}
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900">
            {statistics.total_transactions || 0}
          </p>
        </div>

        {/* Pending Transactions */}
        <div className="border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600 mb-1">Pending Transactions</p>
          <p className="text-2xl font-bold text-gray-900">
            {statistics.pending_transactions || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

