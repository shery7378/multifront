'use client';

import { useEffect, useState } from 'react';
import WalletDashboard from '@/components/wallet/WalletDashboard';
import { useGetRequest } from '@/controller/getRequests';

export default function WalletPage() {
  const { data, error, loading, sendGetRequest } = useGetRequest();
  const [walletData, setWalletData] = useState(null);

  useEffect(() => {
    sendGetRequest('/wallet', true);
  }, []);

  useEffect(() => {
    if (data) {
      setWalletData(data);
    }
  }, [data]);

  if (loading && !walletData) {
    return (
      <div className=" flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error && !walletData) {
    return (
      <div className=" flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return <WalletDashboard walletData={walletData} onRefresh={() => sendGetRequest('/wallet', true)} />;
}

