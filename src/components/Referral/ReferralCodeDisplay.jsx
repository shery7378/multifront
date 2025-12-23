'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGetRequest } from '@/controller/getRequests';
import { FaGift, FaCopy, FaCheck, FaShareAlt, FaUsers, FaCoins, FaRocket } from 'react-icons/fa';
import { FaWhatsapp, FaFacebook, FaTwitter, FaTelegram } from 'react-icons/fa';

export default function ReferralCodeDisplay() {
  const { data, loading, error, sendGetRequest } = useGetRequest();
  const { data: userData, loading: userLoading, sendGetRequest: getUserData } = useGetRequest();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadReferralData = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      sendGetRequest('/referrals', true);
      getUserData('/customer-profile', true);
    }
  };

  useEffect(() => {
    loadReferralData();
  }, []);

  // Listen for order placement events to refresh balance
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOrderPlaced = () => {
      // Refresh data after order is placed (points may have been redeemed)
      setTimeout(() => {
        loadReferralData();
      }, 1500); // Delay to ensure backend has processed
    };

    // Refresh when tab becomes visible (user returns to page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadReferralData();
      }
    };

    window.addEventListener('orderPlaced', handleOrderPlaced);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('orderPlaced', handleOrderPlaced);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Also refresh when component mounts or when userData changes
  useEffect(() => {
    if (!userLoading && userData) {
      // Force a refresh to get latest balance
      getUserData('/customer-profile', true);
    }
  }, [userData?.data?.user?.loyalty_points_balance]);

  // Extract data with useMemo to ensure it updates when data changes
  const { responseData, stats, referralCode, referralUrl, referralsList, loyaltyPointsBalance } = useMemo(() => {
    if (loading || !data) {
      return { responseData: {}, stats: {}, referralCode: '', referralUrl: '', referralsList: [], loyaltyPointsBalance: 0 };
    }

    // Try multiple data structure paths
    let responseData = data?.data || data || {};
    let stats = responseData?.stats || {};
    let referralsList = responseData?.referrals || [];
    
    // Try to get referral code from multiple possible locations
    let referralCode = 
      stats?.referral_code || 
      responseData?.referral_code || 
      data?.stats?.referral_code ||
      data?.referral_code || 
      '';
    
    // Log for debugging
    if (typeof window !== 'undefined') {
      console.log('Referral data extraction:', {
        data,
        responseData,
        stats,
        referralCode,
        referralsList,
      });
    }
    
    // Build referral URL - try from API first, otherwise generate it
    let referralUrl = responseData?.referral_url || data?.data?.referral_url || data?.referral_url || '';
    if (!referralUrl && referralCode && typeof window !== 'undefined') {
      // Generate URL if not provided by API
      const baseUrl = window.location.origin;
      referralUrl = `${baseUrl}/sign-up?ref=${referralCode}`;
    }

    // Get loyalty points balance from userData (from customer-profile endpoint)
    let loyaltyPointsBalance = userData?.data?.user?.loyalty_points_balance ?? userData?.data?.loyalty_points_balance ?? 0;
    
    return { responseData, stats, referralCode, referralUrl, referralsList, loyaltyPointsBalance };
  }, [data, loading, userData]);

  const handleCopyCode = async () => {
    const code = referralCode || stats?.referral_code || data?.data?.stats?.referral_code || '';
    if (!code) {
      console.error('No referral code available');
      alert('Referral code is not available. Please try again.');
      return;
    }

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
          } else {
            alert('Failed to copy. Please copy manually: ' + code);
          }
        } catch (err) {
          console.error('Failed to copy:', err);
          alert('Failed to copy. Please copy manually: ' + code);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy referral code:', err);
      alert('Failed to copy. Please copy manually: ' + code);
    }
  };

  const handleCopyUrl = async () => {
    // Use the referralUrl that was already computed (includes fallback generation)
    const url = referralUrl || '';
    if (!url) {
      console.error('No referral URL available');
      alert('Referral URL is not available. Please try again.');
      return;
    }

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
          } else {
            alert('Failed to copy. Please copy manually: ' + url);
          }
        } catch (err) {
          console.error('Failed to copy:', err);
          alert('Failed to copy. Please copy manually: ' + url);
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy referral URL:', err);
      alert('Failed to copy. Please copy manually: ' + url);
    }
  };

  const shareViaWhatsApp = () => {
    if (!referralCode || !referralUrl) {
      alert('Referral information is not available yet.');
      return;
    }
    const message = `Join me on MultiKonnect! Use my referral code: ${referralCode}\n${referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaFacebook = () => {
    const url = referralUrl || '';
    if (!url) {
      alert('Referral URL is not available yet.');
      return;
    }
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareViaTwitter = () => {
    if (!referralCode || !referralUrl) {
      alert('Referral information is not available yet.');
      return;
    }
    const text = encodeURIComponent(`Join me on MultiKonnect! Use my referral code: ${referralCode}`);
    const url = encodeURIComponent(referralUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareViaTelegram = () => {
    if (!referralCode || !referralUrl) {
      alert('Referral information is not available yet.');
      return;
    }
    const text = encodeURIComponent(`Join me on MultiKonnect! Use my referral code: ${referralCode}\n${referralUrl}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${text}`, '_blank');
  };

  // Debug logging
  useEffect(() => {
    if (data && !loading) {
      console.log('Referral data:', data);
      console.log('Referral code:', referralCode);
      console.log('Referral URL:', referralUrl);
    }
  }, [data, loading, referralCode, referralUrl]);

  if (loading) {
    return (
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    const isConfigError = error.includes('NEXT_PUBLIC_API_URL') || error.includes('Configuration Error');
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
        <div className="text-red-800 dark:text-red-200">
          <h3 className="font-bold text-lg mb-2">Error loading referral information</h3>
          <p className="text-sm mb-4">{error}</p>
          {isConfigError && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <p className="text-xs font-semibold mb-2">Configuration Issue:</p>
              <p className="text-xs">Please set <code className="bg-red-200 dark:bg-red-800 px-1 rounded">NEXT_PUBLIC_API_URL</code> in your <code className="bg-red-200 dark:bg-red-800 px-1 rounded">.env.local</code> file.</p>
              <p className="text-xs mt-1">Example: <code className="bg-red-200 dark:bg-red-800 px-1 rounded">NEXT_PUBLIC_API_URL=http://multikonnect.test</code></p>
            </div>
          )}
          <button
            onClick={() => {
              const token = localStorage.getItem('auth_token');
              if (token) {
                sendGetRequest('/referrals', true);
              } else {
                console.error('No auth token found');
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show message if no referral code is available
  if (!referralCode && !loading && data) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl">
        <div className="text-yellow-800 dark:text-yellow-200">
          <h3 className="font-bold text-lg mb-2">Referral code not available</h3>
          <p className="text-sm mb-4">Your referral code is being generated. Please refresh the page or contact support if this persists.</p>
          <button
            onClick={() => {
              const token = localStorage.getItem('auth_token');
              if (token) {
                sendGetRequest('/referrals', true);
              }
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Referral Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#F44422] via-[#e6391a] to-[#d6391a] rounded-2xl shadow-2xl">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -ml-24 -mb-24"></div>
        
        <div className="relative p-8 text-white">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <FaGift className="text-3xl" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">Invite Friends & Earn Rewards</h2>
              </div>
              <p className="text-white/90 text-lg leading-relaxed">
                Share your unique code with friends and earn amazing rewards when they join and shop!
              </p>
            </div>
            <div className="hidden md:block">
              <FaRocket className="text-6xl text-white/20" />
            </div>
          </div>

          {/* Referral Code Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-4 border border-white/20">
            <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
              <FaGift className="text-sm" />
              Your Unique Referral Code
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={referralCode}
                  readOnly
                  onClick={(e) => e.target.select()}
                  className="w-full px-5 py-4 bg-white/20 border-2 border-white/30 rounded-xl text-white font-mono text-xl font-bold backdrop-blur-sm focus:outline-none focus:border-white/50 transition-all cursor-pointer"
                />
                <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none">
                  {copiedCode && (
                    <span className="text-green-300 font-semibold animate-pulse flex items-center gap-2">
                      <FaCheck /> Copied!
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleCopyCode}
                className={`px-6 py-4 bg-white text-[#F44422] rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2 ${
                  copiedCode ? 'bg-green-100 text-green-700' : ''
                }`}
              >
                {copiedCode ? <FaCheck /> : <FaCopy />}
                {copiedCode ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Referral Link Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
              <FaShareAlt className="text-sm" />
              Your Referral Link
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={referralUrl}
                  readOnly
                  onClick={(e) => e.target.select()}
                  className="w-full px-5 py-4 bg-white/20 border-2 border-white/30 rounded-xl text-white text-sm backdrop-blur-sm focus:outline-none focus:border-white/50 transition-all break-all cursor-pointer"
                />
                <div className="absolute inset-0 flex items-center justify-end pr-4 pointer-events-none">
                  {copiedLink && (
                    <span className="text-green-300 font-semibold animate-pulse flex items-center gap-2">
                      <FaCheck /> Copied!
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleCopyUrl}
                className={`px-6 py-4 bg-white text-[#F44422] rounded-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                  copiedLink ? 'bg-green-100 text-green-700' : ''
                }`}
              >
                {copiedLink ? <FaCheck /> : <FaCopy />}
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FaShareAlt className="text-vivid-red" />
          Share via Social Media
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={shareViaWhatsApp}
            className="flex flex-col items-center justify-center p-4 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-md"
          >
            <FaWhatsapp className="text-2xl mb-2" />
            <span className="text-sm font-semibold">WhatsApp</span>
          </button>
          <button
            onClick={shareViaFacebook}
            className="flex flex-col items-center justify-center p-4 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-md"
          >
            <FaFacebook className="text-2xl mb-2" />
            <span className="text-sm font-semibold">Facebook</span>
          </button>
          <button
            onClick={shareViaTwitter}
            className="flex flex-col items-center justify-center p-4 bg-[#1DA1F2] hover:bg-[#1A91DA] text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-md"
          >
            <FaTwitter className="text-2xl mb-2" />
            <span className="text-sm font-semibold">Twitter</span>
          </button>
          <button
            onClick={shareViaTelegram}
            className="flex flex-col items-center justify-center p-4 bg-[#0088cc] hover:bg-[#0077B5] text-white rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-md"
          >
            <FaTelegram className="text-2xl mb-2" />
            <span className="text-sm font-semibold">Telegram</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Loyalty Points Balance - Prominent Display */}
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaCoins className="text-2xl" />
            </div>
          </div>
          <div className="text-4xl font-bold mb-2">
            {loyaltyPointsBalance || 0}
          </div>
          <div className="text-purple-100 font-medium">Total Points Balance</div>
          <p className="text-sm text-purple-200 mt-2">Your current loyalty points available</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaUsers className="text-2xl" />
            </div>
          </div>
          <div className="text-4xl font-bold mb-2">{stats.total_referrals || 0}</div>
          <div className="text-blue-100 font-medium">Total Referrals</div>
          <p className="text-sm text-blue-200 mt-2">Friends who joined using your code</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <FaCoins className="text-2xl" />
            </div>
          </div>
          <div className="text-4xl font-bold mb-2">{stats.total_points_earned || 0}</div>
          <div className="text-amber-100 font-medium">Points from Referrals</div>
          <p className="text-sm text-amber-200 mt-2">Rewards earned from referral program</p>
        </div>
      </div>

      {/* Referrals List */}
      {referralsList && referralsList.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FaUsers className="text-vivid-red" />
            Your Referrals
          </h3>
          <div className="space-y-3">
            {referralsList.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-vivid-red/10 rounded-full flex items-center justify-center">
                    <FaUsers className="text-vivid-red" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {referral.referred?.name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {referral.referred?.email || ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      referral.status === 'rewarded' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                        : referral.status === 'completed'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {referral.status}
                    </span>
                  </div>
                  {referral.referrer_reward_points > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      +{referral.referrer_reward_points} points
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-500 rounded-lg">
            <FaGift className="text-white text-lg" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-green-900 dark:text-green-100 mb-1">How It Works</h4>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <li>• Share your code or link with friends</li>
              <li>• They sign up using your referral code</li>
              <li>• You both earn reward points when they join</li>
              <li>• You earn more points when they make purchases</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

